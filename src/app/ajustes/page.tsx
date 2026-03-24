"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Lock, Save, Loader2, CheckCircle, FileText, MapPin } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";

export default function AjustesPage() {
  const supabase = createClient();
  const [form, setForm] = useState({
    nombre: "", apellidos: "", telefono: "", email: "",
    colegiado: "", cifNif: "", direccionFacturacion: "",
  });
  const [password, setPassword] = useState({ nueva: "", confirmar: "" });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPass, setLoadingPass]     = useState(false);
  const [okPerfil, setOkPerfil]           = useState(false);
  const [okPass, setOkPass]               = useState(false);
  const [errPerfil, setErrPerfil]         = useState("");
  const [errPass, setErrPass]             = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const m = data.user.user_metadata ?? {};
        setForm({
          nombre:               m.nombre               ?? "",
          apellidos:            m.apellidos            ?? "",
          telefono:             m.telefono             ?? "",
          email:                data.user.email        ?? "",
          colegiado:            m.colegiado            ?? "",
          cifNif:               m.cifNif               ?? "",
          direccionFacturacion: m.direccionFacturacion ?? "",
        });
      }
    });
  }, []);

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPerfil(true); setErrPerfil(""); setOkPerfil(false);
    const { error } = await supabase.auth.updateUser({
      email: form.email,
      data: {
        nombre: form.nombre, apellidos: form.apellidos, telefono: form.telefono,
        colegiado: form.colegiado, cifNif: form.cifNif,
        direccionFacturacion: form.direccionFacturacion,
      },
    });
    if (error) setErrPerfil(error.message);
    else setOkPerfil(true);
    setLoadingPerfil(false);
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrPass(""); setOkPass(false);
    if (password.nueva !== password.confirmar) { setErrPass("Las contraseñas no coinciden"); return; }
    if (password.nueva.length < 6) { setErrPass("Mínimo 6 caracteres"); return; }
    setLoadingPass(true);
    const { error } = await supabase.auth.updateUser({ password: password.nueva });
    if (error) setErrPass(error.message);
    else { setOkPass(true); setPassword({ nueva: "", confirmar: "" }); }
    setLoadingPass(false);
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition";
  const labelCls = "text-xs font-medium text-slate-500 mb-1 block";

  return (
    <main className="p-4 md:p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Ajustes</h1>

      {/* Datos personales */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-violet-500" /> Datos personales
        </h2>
        <form onSubmit={guardarPerfil} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre</label>
              <input value={form.nombre} onChange={e => set("nombre", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Apellidos</label>
              <input value={form.apellidos} onChange={e => set("apellidos", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <PhoneInput value={form.telefono} onChange={v => set("telefono", v)} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.email} onChange={e => set("email", e.target.value)} type="email"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition" />
            </div>
          </div>

          {/* Datos profesionales */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Datos profesionales
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nº de colegiado</label>
                <input value={form.colegiado} onChange={e => set("colegiado", e.target.value)}
                  placeholder="Ej: M-12345" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CIF / NIF</label>
                <input value={form.cifNif} onChange={e => set("cifNif", e.target.value.toUpperCase())}
                  placeholder="Ej: 12345678A" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Dirección de facturación */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 inline" /> Dirección de facturación</span>
            </label>
            <input value={form.direccionFacturacion} onChange={e => set("direccionFacturacion", e.target.value)}
              placeholder="Calle, número, ciudad, CP" className={inputCls} />
          </div>

          {errPerfil && <p className="text-red-500 text-sm">{errPerfil}</p>}
          {okPerfil  && <p className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Guardado correctamente</p>}
          <button type="submit" disabled={loadingPerfil}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {loadingPerfil ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </form>
      </section>

      {/* Contraseña */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-semibold text-slate-700 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-violet-500" /> Cambiar contraseña
        </h2>
        <form onSubmit={cambiarPassword} className="space-y-4">
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input type="password" value={password.nueva} onChange={e => setPassword(p => ({ ...p, nueva: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirmar contraseña</label>
            <input type="password" value={password.confirmar} onChange={e => setPassword(p => ({ ...p, confirmar: e.target.value }))} className={inputCls} />
          </div>
          {errPass && <p className="text-red-500 text-sm">{errPass}</p>}
          {okPass  && <p className="text-emerald-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Contraseña actualizada</p>}
          <button type="submit" disabled={loadingPass}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {loadingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Cambiar contraseña
          </button>
        </form>
      </section>
    </main>
  );
}
