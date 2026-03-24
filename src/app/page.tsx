"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Cita } from "@/lib/store";
import CitaDetailModal from "@/components/CitaDetailModal";
import { CalendarDays, Users, CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle, Loader2, UserX } from "lucide-react";

const estadoConfig = {
  confirmada: { label: "Confirmada", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700",     icon: Clock       },
  cancelada:  { label: "Cancelada",  color: "bg-slate-100 text-slate-500",     icon: XCircle     },
  falta:      { label: "Falta",      color: "bg-red-100 text-red-600",         icon: AlertCircle },
};
const pagoConfig = {
  pagado:    { label: "Pagado",    color: "bg-emerald-100 text-emerald-700" },
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700"     },
  debe:      { label: "Debe",      color: "bg-red-100 text-red-600"         },
};

const DIAS  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export default function Dashboard() {
  const { citas, pacientes, loading } = useApp();
  const [citaSel, setCitaSel] = useState<Cita | null>(null);

  const ahora   = new Date();
  const hoyStr  = ahora.toISOString().split("T")[0];
  const mes     = ahora.getMonth();
  const año     = ahora.getFullYear();
  const fechaFmt = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES[mes]}`;

  const citasHoy        = citas.filter(c => c.fecha === hoyStr).sort((a,b) => a.hora.localeCompare(b.hora));
  const pendientesPago  = citas.filter(c => c.estadoPago !== "pagado");
  const citasMes        = citas.filter(c => { const d = new Date(c.fecha); return d.getMonth() === mes && d.getFullYear() === año; });
  const sesionesCompletadas = citasMes.filter(c => c.estado === "confirmada").length;
  const faltas          = citasMes.filter(c => c.estado === "falta").length;
  const tasaFalta       = citasMes.length > 0 ? Math.round((faltas / citasMes.length) * 100) : 0;

  const ingresosMes = citasMes
    .filter(c => c.estadoPago === "pagado")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  const totalDebe = citas.filter(c => c.estadoPago === "debe")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  // Próxima cita (futura más cercana)
  const proximaCita = citas
    .filter(c => c.fecha > hoyStr || (c.fecha === hoyStr && c.hora > ahora.toTimeString().slice(0,5)))
    .sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))[0];
  const proximaPac = proximaCita ? pacientes.find(p => p.id === proximaCita.pacienteId) : null;

  const stats = [
    { label: "Citas hoy",             value: loading ? "—" : citasHoy.length,          icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50"  },
    { label: "Pacientes activos",     value: loading ? "—" : pacientes.length,          icon: Users,        color: "text-sky-600",    bg: "bg-sky-50"     },
    { label: "Ingresos este mes",     value: loading ? "—" : `${ingresosMes} €`,        icon: TrendingUp,   color: "text-emerald-600",bg: "bg-emerald-50" },
    { label: "Cobros pendientes",     value: loading ? "—" : pendientesPago.length,     icon: CreditCard,   color: "text-amber-600",  bg: "bg-amber-50"   },
    { label: "Sesiones este mes",     value: loading ? "—" : sesionesCompletadas,       icon: CheckCircle,  color: "text-indigo-600", bg: "bg-indigo-50"  },
    { label: "Tasa de faltas",        value: loading ? "—" : `${tasaFalta}%`,           icon: UserX,        color: "text-red-500",    bg: "bg-red-50"     },
  ];

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-slate-500 text-sm">Cargando datos...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 capitalize mb-1">{fechaFmt}</p>
          <h1 className="text-2xl font-bold text-slate-800">Buenos días 👋</h1>
          <p className="text-slate-500 mt-1">Aquí tienes el resumen de hoy</p>
        </div>
        {proximaCita && proximaPac && (
          <button onClick={() => setCitaSel(proximaCita)}
            className="text-right bg-violet-50 hover:bg-violet-100 transition-colors rounded-2xl px-5 py-3 cursor-pointer">
            <p className="text-xs text-violet-500 font-medium mb-0.5">Próxima cita</p>
            <p className="font-semibold text-violet-800 text-sm">{proximaPac.nombre}</p>
            <p className="text-xs text-violet-500">{proximaCita.fecha === hoyStr ? "Hoy" : proximaCita.fecha} · {proximaCita.hora}</p>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Agenda de hoy */}
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Agenda de hoy</h2>
            <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-full">{citasHoy.length} citas</span>
          </div>
          <div className="divide-y divide-slate-50">
            {citasHoy.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">No hay citas hoy</p>}
            {citasHoy.map(cita => {
              const pac = pacientes.find(p => p.id === cita.pacienteId);
              if (!pac) return null;
              const est    = estadoConfig[cita.estado];
              const pago   = pagoConfig[cita.estadoPago];
              const EstIcon = est.icon;
              return (
                <div key={cita.id} onClick={() => setCitaSel(cita)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{pac.nombre}</p>
                    <p className="text-xs text-slate-400">{cita.hora} · {cita.duracion} min · {pac.sesionPrecio} €</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${est.color}`}>
                      <EstIcon className="w-3 h-3" />{est.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pago.color}`}>{pago.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Cobros pendientes</h2>
            {totalDebe > 0 && <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">{totalDebe} € deben</span>}
          </div>
          <div className="divide-y divide-slate-50">
            {pendientesPago.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">Todo al día ✓</p>}
            {pendientesPago.slice(0,6).map(cita => {
              const pac  = pacientes.find(p => p.id === cita.pacienteId);
              if (!pac) return null;
              const pago = pagoConfig[cita.estadoPago];
              return (
                <div key={cita.id} onClick={() => setCitaSel(cita)}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className={`w-8 h-8 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{pac.nombre}</p>
                    <p className="text-xs text-slate-400">{cita.fecha} · {cita.hora}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 text-sm">{pac.sesionPrecio} €</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pago.color}`}>{pago.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CitaDetailModal cita={citaSel} onClose={() => setCitaSel(null)} />
    </div>
  );
}
