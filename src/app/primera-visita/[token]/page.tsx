"use client";
// Formulario de primera visita: lo abre el paciente desde el enlace que le manda la psicóloga.
// No necesita cuenta. Solo puede comprobar su enlace y enviar sus datos una vez (funciones de Supabase).
import { use, useEffect, useState } from "react";
import { Brain, CheckCircle2, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { createClient } from "@/lib/supabase/client";
import { CONSENTIMIENTO_VERSION, PSICOLOGA, TERAPIA, DATOS } from "@/lib/consentimiento";

type Estado = "cargando" | "ok" | "usada" | "caducada" | "no_existe" | "enviado" | "error";

const MENSAJES: Record<string, { titulo: string; texto: string }> = {
  usada:     { titulo: "Este enlace ya se ha usado", texto: "Tus datos ya llegaron. Si necesitas cambiar algo, escribe a la psicóloga." },
  caducada:  { titulo: "Este enlace ha caducado",    texto: "Los enlaces duran 7 días. Pide uno nuevo a la psicóloga." },
  no_existe: { titulo: "Enlace no válido",           texto: "Revisa que el enlace esté completo o pide uno nuevo a la psicóloga." },
  error:     { titulo: "No se ha podido conectar",   texto: "Comprueba tu conexión e inténtalo de nuevo en unos minutos." },
};

export default function PrimeraVisita({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const supabase  = createClient();
  const [estado,  setEstado]  = useState<Estado>("cargando");
  const [enviando, setEnviando] = useState(false);
  const [aviso,   setAviso]   = useState("");
  const [verTexto, setVerTexto] = useState(false);
  const [f, setF] = useState({
    nombre: "", apellidos: "", telefono: "", email: "", fecha_nacimiento: "",
    dni: "", direccion: "", motivo: "", primera_terapia: "", como_conocio: "",
    acepta_terapia: false, acepta_datos: false,
  });
  const set = (k: string, v: string | boolean) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.rpc("invitacion_info", { p_token: token })
      .then(({ data, error }) => setEstado(error ? "error" : (data as Estado)));
  }, [token]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    if (!f.acepta_terapia || !f.acepta_datos) { setAviso("Para continuar tienes que aceptar las dos casillas del consentimiento."); return; }
    setEnviando(true);
    const { data, error } = await supabase.rpc("invitacion_enviar", {
      p_token: token,
      d: { ...f, primera_terapia: f.primera_terapia === "" ? null : f.primera_terapia === "si", version: CONSENTIMIENTO_VERSION },
    });
    setEnviando(false);
    if (error) { setAviso("No se han podido enviar los datos. Inténtalo de nuevo."); return; }
    if (data === "ok") { setEstado("enviado"); window.scrollTo({ top: 0 }); return; }
    if (data === "faltan_datos") { setAviso("Revisa tu nombre, apellidos y teléfono."); return; }
    if (data === "sin_consentimiento") { setAviso("Tienes que aceptar las dos casillas del consentimiento."); return; }
    setEstado(data as Estado);
  }

  const input = "w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-white";
  const label = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <div className="md:-ml-60 min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{PSICOLOGA.nombre}</p>
            <p className="text-xs text-slate-400">Psicóloga · Col. {PSICOLOGA.colegiada}</p>
          </div>
        </div>

        {estado === "cargando" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 flex justify-center"><Loader2 className="w-6 h-6 text-violet-500 animate-spin" /></div>
        )}

        {MENSAJES[estado] && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
            <h1 className="text-lg font-bold text-slate-800">{MENSAJES[estado].titulo}</h1>
            <p className="text-sm text-slate-500 mt-2">{MENSAJES[estado].texto}</p>
          </div>
        )}

        {estado === "enviado" && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-slate-800">¡Gracias! Tus datos ya han llegado</h1>
            <p className="text-sm text-slate-500 mt-2">Julia se pondrá en contacto contigo para confirmar la primera sesión. Ya puedes cerrar esta página.</p>
          </div>
        )}

        {estado === "ok" && (
          <form onSubmit={enviar} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h1 className="text-lg font-bold text-slate-800">Formulario de primera visita</h1>
              <p className="text-sm text-slate-500 mt-1">Rellénalo antes de la primera sesión. Son 2 minutos y tus datos se guardan de forma confidencial.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm">Tus datos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={label}>Nombre *</label>
                  <input className={input} required maxLength={60} autoComplete="given-name" value={f.nombre} onChange={e => set("nombre", e.target.value)} /></div>
                <div><label className={label}>Apellidos *</label>
                  <input className={input} required maxLength={60} autoComplete="family-name" value={f.apellidos} onChange={e => set("apellidos", e.target.value)} /></div>
              </div>
              <div><label className={label}>Teléfono *</label><PhoneInput value={f.telefono} onChange={v => set("telefono", v)} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={label}>Email</label>
                  <input type="email" className={input} maxLength={120} autoComplete="email" value={f.email} onChange={e => set("email", e.target.value)} /></div>
                <div><label className={label}>Fecha de nacimiento</label>
                  <input type="date" className={input} max={new Date().toISOString().slice(0, 10)} value={f.fecha_nacimiento} onChange={e => set("fecha_nacimiento", e.target.value)} /></div>
              </div>
              <p className="text-xs text-slate-400 -mb-1">Solo si quieres factura:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className={label}>DNI / NIE</label>
                  <input className={input} maxLength={20} value={f.dni} onChange={e => set("dni", e.target.value.toUpperCase())} /></div>
                <div className="sm:col-span-2"><label className={label}>Dirección</label>
                  <input className={input} maxLength={200} autoComplete="street-address" value={f.direccion} onChange={e => set("direccion", e.target.value)} /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm">Sobre la consulta</h2>
              <div><label className={label}>¿Qué te trae a consulta? (en pocas palabras)</label>
                <textarea className={input} rows={3} maxLength={1000} value={f.motivo} onChange={e => set("motivo", e.target.value)}
                  placeholder="Por ejemplo: ansiedad en el trabajo, problemas para dormir…" /></div>
              <div><label className={label}>¿Es la primera vez que vas a terapia?</label>
                <div className="flex gap-2">
                  {[["si", "Sí"], ["no", "No"]].map(([v, t]) => (
                    <button type="button" key={v} onClick={() => set("primera_terapia", v)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${f.primera_terapia === v ? "bg-violet-50 border-violet-300 text-violet-700" : "border-slate-200 text-slate-600"}`}>{t}</button>
                  ))}
                </div></div>
              <div><label className={label}>¿Cómo conociste a Julia?</label>
                <select className={input} value={f.como_conocio} onChange={e => set("como_conocio", e.target.value)}>
                  <option value="">Elige una opción</option>
                  {["Google", "Instagram", "Recomendación", "Web", "Otro"].map(o => <option key={o}>{o}</option>)}
                </select></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-violet-500" /> Consentimiento informado</h2>
              <button type="button" onClick={() => setVerTexto(v => !v)} className="text-sm text-violet-600 font-medium flex items-center gap-1">
                {verTexto ? "Ocultar" : "Leer"} el consentimiento completo <ChevronDown className={`w-4 h-4 transition-transform ${verTexto ? "rotate-180" : ""}`} />
              </button>
              {verTexto && (
                <div className="text-sm text-slate-600 space-y-3 bg-slate-50 rounded-xl p-4 max-h-80 overflow-y-auto">
                  {TERAPIA.map(b => (
                    <div key={b.titulo}><p className="font-semibold text-slate-700">{b.titulo}</p>
                      <ul className="list-disc pl-5 space-y-1 mt-1">{b.puntos.map(p => <li key={p}>{p}</li>)}</ul></div>
                  ))}
                  <div><p className="font-semibold text-slate-700">Protección de datos</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">{DATOS.map(p => <li key={p}>{p}</li>)}</ul></div>
                </div>
              )}
              <label className="flex gap-3 items-start text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5 w-5 h-5 accent-violet-600 flex-shrink-0" checked={f.acepta_terapia} onChange={e => set("acepta_terapia", e.target.checked)} />
                <span>He leído y acepto el <b>consentimiento informado</b> para la intervención psicológica y las condiciones del servicio. *</span>
              </label>
              <label className="flex gap-3 items-start text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5 w-5 h-5 accent-violet-600 flex-shrink-0" checked={f.acepta_datos} onChange={e => set("acepta_datos", e.target.checked)} />
                <span>Acepto el <b>tratamiento de mis datos</b>, incluidos los de salud, para mi atención psicológica. *</span>
              </label>
            </div>

            {aviso && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{aviso}</p>}
            <button type="submit" disabled={enviando}
              className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {enviando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar mis datos
            </button>
            <p className="text-xs text-slate-400 text-center pb-6">Dudas: {PSICOLOGA.email} · {PSICOLOGA.telefono}</p>
          </form>
        )}
      </div>
    </div>
  );
}
