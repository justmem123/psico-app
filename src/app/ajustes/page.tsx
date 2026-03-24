"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Phone, Mail, Lock, Save, Loader2, CheckCircle } from "lucide-react";

export default function AjustesPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ nombre: "", apellidos: "", telefono: "", email: "" });
  const [password, setPassword] = useState({ nueva: "", confirmar: "" });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPass, setLoadingPass]     = useState(false);
  const [okPerfil, setOkPerfil]           = useState(false);
  const [okPass, setOkPass]               = useState(false);
  const [errPerfil, setErrPerfil]         = useState("");
  const [errPass, setErrPass]             = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const m = data.user.user_metadata ?? {};
        setForm({
          nombre:    m.nombre    ?? "",
          apellidos: m.apellidos ?? "",
          telefono:  m.telefono  ?? "",
          email:     data.user.email ?? "",
        });
      }
    });
  }, []);

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPerfil(true); setErrPerfil(""); setOkPerfil(false);
    const { error } = await supabase.auth.updateUser({
      email: form.email,
      data: { nombre: form.nombre, apellidos: form.apellidos, telefono: form.telefono },
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

  return (
    <main className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Ajustes</h1>

      {/* Perfil */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <h2 className="font-semibold text-slate-700 mb-5 flex items-center gap-2">
          <User className="w-4 h-4 text-violet-500" /> Datos personales
        </h2>
        <form onSubmit={guardarPerfil} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Apellidos</label>
              <input value={form.apellidos} onChange={e => setForm(p => ({ ...p, apellidos: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                type="email"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
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
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nueva contraseña</label>
            <input type="password" value={password.nueva} onChange={e => setPassword(p => ({ ...p, nueva: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Confirmar contraseña</label>
            <input type="password" value={password.confirmar} onChange={e => setPassword(p => ({ ...p, confirmar: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
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
