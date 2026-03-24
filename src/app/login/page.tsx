"use client";
import { useState } from "react";
import { Brain, Mail, Lock, Eye, EyeOff, Loader2, User, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [modo,     setModo]     = useState<"login"|"registro">("login");
  const [form,     setForm]     = useState({ nombre: "", apellidos: "", telefono: "", email: "", password: "" });
  const [verPass,  setVerPass]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [ok,       setOk]       = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setOk("");

    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) setError("Email o contraseña incorrectos");
      else router.push("/");
    } else {
      const { error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { nombre: form.nombre, apellidos: form.apellidos, telefono: form.telefono } },
      });
      if (error) setError(error.message);
      else setOk("¡Cuenta creada! Revisa tu email para confirmar.");
    }
    setLoading(false);
  }

  const inputCls = "w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">PsicoGestión</h1>
          <p className="text-slate-400 text-sm mt-1">Panel profesional para psicólogos</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <h2 className="font-bold text-slate-800 text-lg mb-6">
            {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campos solo en registro */}
            {modo === "registro" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={form.nombre} onChange={e => set("nombre", e.target.value)}
                        placeholder="María" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Apellidos</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={form.apellidos} onChange={e => set("apellidos", e.target.value)}
                        placeholder="García" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" required value={form.telefono} onChange={e => set("telefono", e.target.value)}
                      placeholder="600 000 000" className={inputCls} />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="tu@email.com" className={inputCls} />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className={labelCls}>Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={verPass ? "text" : "password"} required minLength={6}
                  value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition" />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {ok    && <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">{ok}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {modo === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            {modo === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            {" "}
            <button onClick={() => { setModo(modo === "login" ? "registro" : "login"); setError(""); setOk(""); }}
              className="text-violet-600 font-semibold hover:underline">
              {modo === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
