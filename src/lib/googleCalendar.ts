// Lectura del calendario de Google (dirección iCal secreta) y emparejado con pacientes.
// Solo se usa en el servidor (route handler /api/google-sync).
import ICAL from "ical.js";

export interface EventoGoogle {
  uid:      string;  // único por ocurrencia (en eventos periódicos incluye la fecha original)
  titulo:   string;
  fecha:    string;  // YYYY-MM-DD en la zona horaria del calendario
  hora:     string;  // HH:MM
  duracion: number;  // minutos
}

const MAX_OCURRENCIAS = 3000;

/** Normaliza un título: minúsculas, sin acentos ni signos. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim();
}

function enZona(d: Date, tz: string): { fecha: string; hora: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map(p => [p.type, p.value])
  );
  return { fecha: `${parts.year}-${parts.month}-${parts.day}`, hora: `${parts.hour}:${parts.minute}` };
}

/**
 * Convierte el .ics en eventos con hora (se descartan los de día completo y los cancelados),
 * expandiendo los periódicos dentro de [desde, hasta].
 */
export function leerEventos(ics: string, desde: Date, hasta: Date): EventoGoogle[] {
  const comp = new ICAL.Component(ICAL.parse(ics));
  for (const tz of comp.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(tz);
  const zona = (comp.getFirstPropertyValue("x-wr-timezone") as string | null) || "Europe/Madrid";

  // Agrupar: evento principal + excepciones (RECURRENCE-ID) por UID
  const principales = new Map<string, ICAL.Event>();
  const excepciones: ICAL.Event[] = [];
  for (const vev of comp.getAllSubcomponents("vevent")) {
    const ev = new ICAL.Event(vev);
    if (ev.isRecurrenceException()) excepciones.push(ev);
    else principales.set(ev.uid, ev);
  }
  const huerfanas: ICAL.Event[] = [];
  for (const ex of excepciones) {
    const p = principales.get(ex.uid);
    if (p) p.relateException(ex); else huerfanas.push(ex);
  }

  const out: EventoGoogle[] = [];
  const añadir = (uid: string, comp: ICAL.Component, inicio: ICAL.Time, fin: ICAL.Time) => {
    if (inicio.isDate) return; // día completo → no es una sesión
    if (String(comp.getFirstPropertyValue("status") ?? "").toUpperCase() === "CANCELLED") return;
    const ini = inicio.toJSDate();
    if (ini < desde || ini > hasta) return;
    const duracion = Math.round((fin.toJSDate().getTime() - ini.getTime()) / 60000);
    const titulo = String(comp.getFirstPropertyValue("summary") ?? "").trim();
    if (!titulo) return;
    out.push({ uid, titulo, ...enZona(ini, zona), duracion: duracion > 0 ? duracion : 50 });
  };

  for (const ev of [...principales.values(), ...huerfanas]) {
    if (!ev.isRecurring()) {
      const uid = ev.isRecurrenceException() ? `${ev.uid}::${ev.recurrenceId.toString()}` : ev.uid;
      añadir(uid, ev.component, ev.startDate, ev.endDate);
      continue;
    }
    const it = ev.iterator();
    let n = 0;
    for (let t = it.next(); t && n < MAX_OCURRENCIAS; t = it.next(), n++) {
      if (t.toJSDate() > hasta) break;
      const det = ev.getOccurrenceDetails(t);
      añadir(`${ev.uid}::${det.recurrenceId.toString()}`, det.item.component, det.startDate, det.endDate);
    }
  }
  return out;
}

export interface PacienteMin { id: string; nombre: string; }

const VACIAS = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "i"]);

/**
 * Busca el paciente cuyo nombre aparece en el título ("Sesión María López", "María L. online"...).
 * - El nombre de pila tiene que aparecer siempre.
 * - Si solo hay un paciente con ese nombre de pila, basta con eso.
 * - Si hay varios, gana el que más palabras (apellidos o iniciales) coincida, y solo si no hay empate.
 */
export function emparejar(titulo: string, pacientes: PacienteMin[]): string | null {
  const t = normalizar(titulo).split(" ");
  const tSet = new Set(t);
  const iniciales = new Set(t.filter(w => w.length === 1));

  const candidatos: { id: string; puntos: number }[] = [];
  for (const p of pacientes) {
    const pal = normalizar(p.nombre).split(" ").filter(w => w.length > 1 && !VACIAS.has(w));
    if (!pal.length || !tSet.has(pal[0])) continue;
    let puntos = 0;
    for (const w of pal) if (tSet.has(w)) puntos += 2; else if (iniciales.has(w[0])) puntos += 1;
    candidatos.push({ id: p.id, puntos });
  }
  if (candidatos.length === 1) return candidatos[0].id;
  if (!candidatos.length) return null;
  candidatos.sort((a, b) => b.puntos - a.puntos);
  return candidatos[0].puntos > candidatos[1].puntos && candidatos[0].puntos >= 3 ? candidatos[0].id : null;
}
