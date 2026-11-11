"use client";
import { useState } from "react";
import Modal from "./ui/Modal";
import { useApp } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { CalendarDays, Loader2 } from "lucide-react";

/** Aviso flotante + ventana para asignar a un paciente los eventos de Google que no se reconocieron. */
export default function GoogleSinAsignarAviso() {
  const { google, pacientes, sincronizarGoogle } = useApp();
  const [open, setOpen]       = useState(false);
  const [eleccion, setElec]   = useState<Record<string, string>>({});
  const [guardando, setGuard] = useState<string | null>(null);
  const supabase = createClient();

  const lista = google.sinAsignar;
  if (!lista.length) return null;

  async function guardar(clave: string, pacienteId: string | null) {
    setGuard(clave);
    await supabase.from("google_alias").upsert({ titulo: clave, paciente_id: pacienteId }, { onConflict: "user_id,titulo" });
    await sincronizarGoogle();
    setGuard(null);
  }

  const fmt = (f: string) => new Date(f + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="fixed z-40 right-4 bottom-24 md:bottom-6 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-2.5 rounded-full shadow-md hover:bg-amber-100 transition-colors">
        <CalendarDays className="w-4 h-4" />
        {lista.length} {lista.length === 1 ? "evento" : "eventos"} de Google sin paciente
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eventos de Google sin paciente">
        <p className="text-xs text-slate-500 mb-4">
          No sé a qué paciente corresponden. Elige uno y lo recordaré para los próximos eventos con el mismo título,
          o pulsa «Ignorar» si no es una sesión.
        </p>
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {lista.map(ev => (
            <li key={ev.clave} className="border border-slate-100 rounded-xl p-3">
              <p className="text-sm font-semibold text-slate-700">{ev.titulo}</p>
              <p className="text-xs text-slate-400 mb-2">
                {ev.ocurrencias} {ev.ocurrencias === 1 ? "vez" : "veces"} · {fmt(ev.proxima)}
              </p>
              <div className="flex gap-2">
                <select value={eleccion[ev.clave] ?? ""} onChange={e => setElec(p => ({ ...p, [ev.clave]: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="">Elegir paciente…</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <button disabled={!eleccion[ev.clave] || guardando !== null} onClick={() => guardar(ev.clave, eleccion[ev.clave])}
                  className="px-3 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white disabled:opacity-40">
                  {guardando === ev.clave ? <Loader2 className="w-4 h-4 animate-spin" /> : "Asignar"}
                </button>
                <button disabled={guardando !== null} onClick={() => guardar(ev.clave, null)}
                  className="px-3 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                  Ignorar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
