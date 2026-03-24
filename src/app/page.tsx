"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
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
  const [citaSelId, setCitaSelId] = useState<string | null>(null);

  const ahora   = new Date();
  const hoyStr  = ahora.toISOString().split("T")[0];
  const mes     = ahora.getMonth();
  const año     = ahora.getFullYear();
  const fechaFmt = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES[mes]}`;

  const citasHoy       = citas.filter(c => c.fecha === hoyStr).sort((a,b) => a.hora.localeCompare(b.hora));
  const pendientesPago = citas.filter(c => c.estadoPago !== "pagado");
  const citasMes       = citas.filter(c => { const d = new Date(c.fecha); return d.getMonth() === mes && d.getFullYear() === año; });
  const sesionesCompletadas = citasMes.filter(c => c.estado === "confirmada").length;
  const faltas         = citasMes.filter(c => c.estado === "falta").length;
  const tasaFalta      = citasMes.length > 0 ? Math.round((faltas / citasMes.length) * 100) : 0;

  const ingresosMes = citasMes
    .filter(c => c.estadoPago === "pagado")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  const totalDebe = citas.filter(c => c.estadoPago === "debe")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  const proximaCita = citas
    .filter(c => c.fecha > hoyStr || (c.fecha === hoyStr && c.hora > ahora.toTimeString().slice(0,5)))
    .sort((a,b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))[0];
  const proximaPac = proximaCita ? pacientes.find(p => p.id === proximaCita.pacienteId) : null;

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-slate-500 text-sm">Cargando datos...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 capitalize mb-1">{fechaFmt}</p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Buenos días 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Aquí tienes el resumen de hoy</p>
        </div>
        {proximaCita && proximaPac && (
          <button onClick={() => setCitaSelId(proximaCita.id)}
            className="text-right bg-violet-50 hover:bg-violet-100 transition-colors rounded-2xl px-4 py-2.5 cursor-pointer">
            <p className="text-xs text-violet-500 font-medium mb-0.5">Próxima cita</p>
            <p className="font-semibold text-violet-800 text-sm">{proximaPac.nombre.split(" ")[0]}</p>
            <p className="text-xs text-violet-500">{proximaCita.fecha === hoyStr ? "Hoy" : proximaCita.fecha} · {proximaCita.hora}</p>
          </button>
        )}
      </div>

      {/* Stats principales — igual que antes: 4 columnas desktop, 2 en móvil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        {[
          { label: "Citas hoy",         value: citasHoy.length,      icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50"  },
          { label: "Pacientes activos", value: pacientes.length,      icon: Users,        color: "text-sky-600",    bg: "bg-sky-50"     },
          { label: "Ingresos este mes", value: `${ingresosMes} €`,    icon: TrendingUp,   color: "text-emerald-600",bg: "bg-emerald-50" },
          { label: "Cobros pendientes", value: pendientesPago.length, icon: CreditCard,   color: "text-amber-600",  bg: "bg-amber-50"   },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stats secundarias */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: "Sesiones completadas este mes", value: sesionesCompletadas, icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Tasa de faltas este mes",       value: `${tasaFalta}%`,     icon: UserX,       color: "text-red-500",    bg: "bg-red-50"    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        {/* Agenda de hoy */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Agenda de hoy</h2>
            <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-full">{citasHoy.length} citas</span>
          </div>
          <div className="divide-y divide-slate-50">
            {citasHoy.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No hay citas hoy</p>}
            {citasHoy.map(cita => {
              const pac = pacientes.find(p => p.id === cita.pacienteId);
              if (!pac) return null;
              const est     = estadoConfig[cita.estado];
              const pago    = pagoConfig[cita.estadoPago];
              const EstIcon = est.icon;
              return (
                <div key={cita.id} onClick={() => setCitaSelId(cita.id)}
                  className="flex items-center gap-3 px-4 md:px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className={`w-9 h-9 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{pac.nombre}</p>
                    <p className="text-xs text-slate-400">{cita.hora} · {cita.duracion} min · {pac.sesionPrecio} €</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${est.color}`}>
                      <EstIcon className="w-3 h-3" />{est.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pago.color}`}>{pago.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Cobros pendientes</h2>
            {totalDebe > 0 && <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">{totalDebe} € deben</span>}
          </div>
          <div className="divide-y divide-slate-50">
            {pendientesPago.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">Todo al día ✓</p>}
            {pendientesPago.slice(0,6).map(cita => {
              const pac  = pacientes.find(p => p.id === cita.pacienteId);
              if (!pac) return null;
              const pago = pagoConfig[cita.estadoPago];
              return (
                <div key={cita.id} onClick={() => setCitaSelId(cita.id)}
                  className="flex items-center gap-3 px-4 md:px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer">
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

      <CitaDetailModal citaId={citaSelId} onClose={() => setCitaSelId(null)} />
    </div>
  );
}
