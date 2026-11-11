"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/store";
import { CalendarDays, Loader2, RefreshCw, CheckCircle, Unplug } from "lucide-react";

export default function GoogleCalendarAjustes() {
  const supabase = createClient();
  const { google, sincronizarGoogle } = useApp();
  const [url, setUrl]           = useState("");
  const [guardada, setGuardada] = useState(false);
  const [guardando, setGuard]   = useState(false);
  const [err, setErr]           = useState("");

  useEffect(() => {
    supabase.from("google_sync").select("ical_url").maybeSingle().then(({ data }) => {
      if (data?.ical_url) { setUrl(data.ical_url); setGuardada(true); }
    });
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const limpia = url.trim().replace(/^webcal:/i, "https:");
    if (!/^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics$/.test(limpia)) {
      setErr("Pega la «Dirección secreta en formato iCal» (empieza por https://calendar.google.com/calendar/ical/ y termina en .ics)");
      return;
    }
    setGuard(true);
    const { error } = await supabase.from("google_sync").upsert({ ical_url: limpia }, { onConflict: "user_id" });
    setGuard(false);
    if (error) { setErr(error.message); return; }
    setUrl(limpia); setGuardada(true);
    await sincronizarGoogle();
  }

  async function desconectar() {
    await supabase.from("google_sync").delete().neq("ical_url", "");
    setUrl(""); setGuardada(false);
    await sincronizarGoogle();
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition";
  const r = google.resumen;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
      <h2 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-violet-500" /> Google Calendar
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Las citas que apuntes en Google Calendar aparecen solas en la agenda. Basta con que el título lleve el nombre
        del paciente (por ejemplo «Sesión María López»). Los cambios en la app no se pasan a Google.
      </p>

      {!guardada && (
        <details className="text-xs text-slate-500 mb-4 bg-slate-50 rounded-xl p-3">
          <summary className="cursor-pointer font-medium text-slate-600">¿Dónde encuentro la dirección?</summary>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Abre Google Calendar en el ordenador.</li>
            <li>En la izquierda, pasa el ratón por tu calendario → ⋮ → <b>Configuración y uso compartido</b>.</li>
            <li>Baja hasta <b>Integrar el calendario</b> y copia la <b>Dirección secreta en formato iCal</b>.</li>
          </ol>
          <p className="mt-2">Es privada: no la compartas con nadie.</p>
        </details>
      )}

      <form onSubmit={guardar} className="space-y-3">
        <input value={url} onChange={e => { setUrl(e.target.value); setGuardada(false); }}
          type={guardada ? "password" : "text"} placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
          className={inputCls} />
        {err && <p className="text-red-500 text-sm">{err}</p>}
        {google.error && guardada && <p className="text-red-500 text-sm">{google.error}</p>}
        {guardada && r && !google.error && (
          <p className="text-emerald-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Conectado · última sincronización {r.hora}
            {(r.creadas > 0 || r.actualizadas > 0 || r.borradas > 0) &&
              ` (${r.creadas} nuevas, ${r.actualizadas} actualizadas, ${r.borradas} quitadas)`}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!guardada ? (
            <button type="submit" disabled={guardando || !url.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              Conectar
            </button>
          ) : (
            <>
              <button type="button" onClick={sincronizarGoogle} disabled={google.sincronizando}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                <RefreshCw className={`w-4 h-4 ${google.sincronizando ? "animate-spin" : ""}`} />
                Sincronizar ahora
              </button>
              <button type="button" onClick={desconectar}
                className="flex items-center gap-2 text-slate-500 hover:bg-slate-100 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                <Unplug className="w-4 h-4" /> Desconectar
              </button>
            </>
          )}
        </div>
      </form>
    </section>
  );
}
