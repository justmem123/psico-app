import { getCitasHoy, getCitasPendientesPago, getPaciente, getIngresosMes, citas, pacientes } from "@/lib/mock-data";
import { CalendarDays, Users, CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const estadoConfig = {
  confirmada: { label: "Confirmada", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  pendiente:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700",     icon: Clock        },
  cancelada:  { label: "Cancelada",  color: "bg-slate-100 text-slate-500",     icon: XCircle      },
  falta:      { label: "Falta",      color: "bg-red-100 text-red-600",         icon: AlertCircle  },
};

const pagoConfig = {
  pagado:    { label: "Pagado",    color: "bg-emerald-100 text-emerald-700" },
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700"     },
  debe:      { label: "Debe",      color: "bg-red-100 text-red-600"         },
};

export default function Dashboard() {
  const citasHoy       = getCitasHoy();
  const pendientesPago = getCitasPendientesPago();
  const ingresosMes    = getIngresosMes();
  const totalDebe      = pendientesPago
    .filter(c => c.estadoPago === "debe")
    .reduce((s, c) => s + getPaciente(c.pacienteId).sesionPrecio, 0);

  const ahora    = new Date();
  const diasSem  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses    = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const fechaFmt = `${diasSem[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]}`;

  const stats = [
    { label: "Citas hoy",          value: citasHoy.length,          icon: CalendarDays, color: "text-violet-600", bg: "bg-violet-50"  },
    { label: "Pacientes activos",  value: pacientes.length,          icon: Users,        color: "text-sky-600",    bg: "bg-sky-50"     },
    { label: "Ingresos este mes",  value: `${ingresosMes} €`,        icon: TrendingUp,   color: "text-emerald-600",bg: "bg-emerald-50" },
    { label: "Cobros pendientes",  value: pendientesPago.length,     icon: CreditCard,   color: "text-amber-600",  bg: "bg-amber-50"   },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-slate-400 capitalize mb-1">{fechaFmt}</p>
        <h1 className="text-2xl font-bold text-slate-800">Buenos días 👋</h1>
        <p className="text-slate-500 mt-1">Aquí tienes el resumen de hoy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
            <span className="text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1 rounded-full">
              {citasHoy.length} citas
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {citasHoy.length === 0 && (
              <p className="text-center text-slate-400 py-12 text-sm">No hay citas hoy</p>
            )}
            {citasHoy.map(cita => {
              const paciente = getPaciente(cita.pacienteId);
              const est      = estadoConfig[cita.estado];
              const pago     = pagoConfig[cita.estadoPago];
              const EstIcon  = est.icon;
              return (
                <div key={cita.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{paciente.nombre}</p>
                    <p className="text-xs text-slate-400">{cita.hora} · {cita.duracion} min · {paciente.sesionPrecio} €</p>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${est.color}`}>
                      <EstIcon className="w-3 h-3" />
                      {est.label}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pago.color}`}>
                      {pago.label}
                    </span>
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
            {totalDebe > 0 && (
              <span className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full">
                {totalDebe} € deben
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {pendientesPago.slice(0,6).map(cita => {
              const paciente = getPaciente(cita.pacienteId);
              const pago     = pagoConfig[cita.estadoPago];
              return (
                <div key={cita.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{paciente.nombre}</p>
                    <p className="text-xs text-slate-400">{cita.fecha} · {cita.hora}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 text-sm">{paciente.sesionPrecio} €</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pago.color}`}>
                      {pago.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {pendientesPago.length > 6 && (
            <div className="px-6 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">+{pendientesPago.length - 6} más pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
