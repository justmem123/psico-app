"use client";
// Crea un enlace de un solo uso (7 días) para que un paciente nuevo rellene su ficha y el consentimiento.
import { useState } from "react";
import { Copy, Check, Loader2, MessageCircle } from "lucide-react";
import Modal from "./ui/Modal";
import PhoneInput from "./ui/PhoneInput";
import { createClient } from "@/lib/supabase/client";

interface Props { open: boolean; onClose: () => void; }

export default function InvitarPacienteModal({ open, onClose }: Props) {
  const supabase = createClient();
  const [nombre,   setNombre]   = useState("");
  const [telefono, setTelefono] = useState("");
  const [enlace,   setEnlace]   = useState("");
  const [cargando, setCargando] = useState(false);
  const [copiado,  setCopiado]  = useState(false);
  const [error,    setError]    = useState("");

  function cerrar() { setNombre(""); setTelefono(""); setEnlace(""); setError(""); setCopiado(false); onClose(); }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true); setError("");
    const { data, error } = await supabase.from("invitaciones").insert({ nombre_hint: nombre.trim() || null }).select("token").single();
    setCargando(false);
    if (error || !data) { setError("No se pudo crear el enlace. Inténtalo de nuevo."); return; }
    setEnlace(`${window.location.origin}/primera-visita/${data.token}`);
  }

  const saludo  = nombre.trim() ? `Hola ${nombre.trim().split(" ")[0]}` : "Hola";
  const mensaje = `${saludo}, soy Julia, psicóloga. Antes de nuestra primera sesión, ¿puedes rellenar este formulario con tus datos y el consentimiento? Son 2 minutos: ${enlace}`;
  const numero  = telefono.replace(/\D/g, "");
  const wa      = `https://wa.me/${numero.length >= 9 ? numero : ""}?text=${encodeURIComponent(mensaje)}`;

  async function copiar() {
    try { await navigator.clipboard.writeText(mensaje); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch {}
  }

  const input = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-slate-50";
  const label = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <Modal open={open} onClose={cerrar} title="Invitar paciente nuevo">
      {!enlace ? (
        <form onSubmit={crear} className="space-y-4">
          <p className="text-sm text-slate-500">Se crea un enlace para que el paciente rellene sus datos y el consentimiento desde el móvil. Vale una sola vez y caduca en 7 días. Al enviarlo, aparece en tus pacientes con la etiqueta <b>Nuevo</b>.</p>
          <div><label className={label}>Nombre (opcional, para el saludo)</label>
            <input className={input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Laura" /></div>
          <div><label className={label}>WhatsApp (opcional)</label>
            <PhoneInput value={telefono} onChange={setTelefono} /></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={cargando}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />} Crear enlace
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-600 whitespace-pre-wrap break-words">{mensaje}</div>
          <a href={wa} target="_blank" rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
          </a>
          <button onClick={copiar}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} {copiado ? "Copiado" : "Copiar mensaje"}
          </button>
        </div>
      )}
    </Modal>
  );
}
