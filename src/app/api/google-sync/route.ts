// Sincroniza Google Calendar → citas de PsicoApp para el usuario con sesión iniciada.
// Usa la sesión del usuario (RLS), así que solo puede tocar sus propios datos.
import { createClient } from "@/lib/supabase/server";
import { leerEventos, emparejar, normalizar, type EventoGoogle } from "@/lib/googleCalendar";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DIAS_ATRAS    = 30;
const DIAS_ADELANTE = 180;

export interface SinAsignar { clave: string; titulo: string; ocurrencias: number; proxima: string; }

function ymd(d: Date) { return d.toISOString().slice(0, 10); }

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No has iniciado sesión" }, { status: 401 });

  const { data: cfg } = await supabase.from("google_sync").select("ical_url").eq("user_id", user.id).maybeSingle();
  if (!cfg?.ical_url) return Response.json({ configurado: false });

  // Solo direcciones de Google Calendar (evita usar el servidor para pedir URLs arbitrarias)
  let url: URL;
  try { url = new URL(cfg.ical_url.replace(/^webcal:/i, "https:")); } catch { url = new URL("about:blank"); }
  if (url.protocol !== "https:" || url.hostname !== "calendar.google.com") {
    return Response.json({ configurado: true, error: "La dirección no es de Google Calendar" }, { status: 400 });
  }

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return Response.json({ configurado: true, error: `Google respondió ${res.status}. Revisa la dirección secreta.` }, { status: 502 });
  }

  const ahora = new Date();
  const desde = new Date(ahora.getTime() - DIAS_ATRAS * 864e5);
  const hasta = new Date(ahora.getTime() + DIAS_ADELANTE * 864e5);
  let eventos: EventoGoogle[];
  try { eventos = leerEventos(await res.text(), desde, hasta); }
  catch { return Response.json({ configurado: true, error: "No se pudo leer el calendario" }, { status: 502 }); }

  const [{ data: pacs }, { data: alias }, { data: citas }] = await Promise.all([
    supabase.from("pacientes").select("id, nombre").eq("user_id", user.id),
    supabase.from("google_alias").select("titulo, paciente_id").eq("user_id", user.id),
    supabase.from("citas").select("id, paciente_id, fecha, hora, duracion, estado_pago, google_uid")
      .eq("user_id", user.id).gte("fecha", ymd(desde)).lte("fecha", ymd(hasta)),
  ]);
  const pacientes = pacs ?? [];
  const aliasMap = new Map((alias ?? []).map(a => [a.titulo as string, a.paciente_id as string | null]));
  const porUid = new Map((citas ?? []).filter(c => c.google_uid).map(c => [c.google_uid as string, c]));
  const manuales = (citas ?? []).filter(c => !c.google_uid);

  let creadas = 0, actualizadas = 0, borradas = 0;
  const sinAsignar = new Map<string, SinAsignar>();
  const vistos = new Set<string>();
  const hoy = ymd(ahora);

  for (const ev of eventos) {
    vistos.add(ev.uid);
    const existente = porUid.get(ev.uid);
    if (existente) {
      if (existente.fecha !== ev.fecha || existente.hora.slice(0, 5) !== ev.hora || existente.duracion !== ev.duracion) {
        await supabase.from("citas").update({ fecha: ev.fecha, hora: ev.hora, duracion: ev.duracion }).eq("id", existente.id);
        actualizadas++;
      }
      continue;
    }

    const clave = normalizar(ev.titulo);
    const pacienteId = aliasMap.has(clave) ? aliasMap.get(clave)! : emparejar(ev.titulo, pacientes);
    if (aliasMap.has(clave) && pacienteId === null) continue; // marcado como «ignorar»
    if (!pacienteId) {
      const s = sinAsignar.get(clave);
      if (s) { s.ocurrencias++; if (ev.fecha >= hoy && (s.proxima < hoy || ev.fecha < s.proxima)) s.proxima = ev.fecha; }
      else sinAsignar.set(clave, { clave, titulo: ev.titulo, ocurrencias: 1, proxima: ev.fecha });
      continue;
    }

    // ¿Ya la había apuntado a mano en la app ese mismo día? → se enlaza en vez de duplicarla
    const idx = manuales.findIndex(c => c.paciente_id === pacienteId && c.fecha === ev.fecha);
    if (idx >= 0) {
      const m = manuales.splice(idx, 1)[0];
      await supabase.from("citas").update({ google_uid: ev.uid, hora: ev.hora, duracion: ev.duracion }).eq("id", m.id);
      actualizadas++;
      continue;
    }

    const { error } = await supabase.from("citas").insert({
      paciente_id: pacienteId, fecha: ev.fecha, hora: ev.hora, duracion: ev.duracion,
      estado: "pendiente", estado_pago: "pendiente", user_id: user.id, google_uid: ev.uid,
    });
    if (!error) creadas++;
  }

  // Citas que venían de Google y ya no están: se borran solo si son de hoy en adelante y no están pagadas
  const aBorrar = [...porUid.values()].filter(c => !vistos.has(c.google_uid as string) && c.fecha >= hoy && c.estado_pago !== "pagado");
  if (aBorrar.length) {
    await supabase.from("citas").delete().eq("user_id", user.id).in("id", aBorrar.map(c => c.id));
    borradas = aBorrar.length;
  }

  await supabase.from("google_sync").update({ ultima_sync: ahora.toISOString() }).eq("user_id", user.id);

  return Response.json({
    configurado: true, creadas, actualizadas, borradas, eventos: eventos.length,
    sinAsignar: [...sinAsignar.values()].sort((a, b) => a.titulo.localeCompare(b.titulo)),
  });
}
