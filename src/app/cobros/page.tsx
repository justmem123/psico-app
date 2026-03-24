"use client";
import { useState } from "react";
import { CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { useApp } from "@/lib/store";

type Filtro = "todos" | "pendiente" | "pagado" | "debe";

const filtroOpciones: { value: Filtro; label: string }[] = [
  { value: "todos",     label: "Todos"     },
  { value: "pendiente", label: "Pendiente" },
  { value: "debe",      label: "Debe"      },
  { value: "pagado",    label: "Pagado"    },
];

const pagoConfig = {
  pagado:    { label: "Pagado",    color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700",     icon: Clock       },
  debe:      { label: "Debe",      color: "bg-red-100 text-red-600",         icon: AlertCircle },
};

export default function CobrosPage() {
  const { citas, pacientes, marcarPagado } = useApp();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const getPac = (id: string) => pacientes.find(p => p.id === id)!;

  const citasFiltradas = citas
    .filter(c => filtro === "todos" || c.estadoPago === filtro)
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const totalCobrado   = citas.filter(c => c.estadoPago === "pagado").reduce((s,c) => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);
  const totalPendiente = citas.filter(c => c.estadoPago === "pendiente").reduce((s,c) => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);
  const totalDebe      = citas.filter(c => c.estadoPago === "debe").reduce((s,c) => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);

  const stats = [
    { label: "Cobrado",   value: `${totalCobrado} €`,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", icon: TrendingUp   },
    { label: "Pendiente", value: `${totalPendiente} €`, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   icon: Clock        },
    { label: "Debe",      value: `${totalDebe} €`,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100",     icon: TrendingDown },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cobros</h1>
        <p className="text-slate-400 text-sm mt-0.5">Control de pagos y facturas</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border ${border} ${bg} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-semibold ${color}`}>{label}</p>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
            <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1" />
            {filtroOpciones.map(({ value, label }) => (
              <button key={value} onClick={() => setFiltro(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtro === value ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400">{citasFiltradas.length} registros</p>
        </div>

        <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="col-span-4">Paciente</div>
          <div className="col-span-2 text-center">Fecha</div>
          <div className="col-span-2 text-center">Hora</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-1 text-right">Importe</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>

        <div className="divide-y divide-slate-50">
          {citasFiltradas.map(cita => {
            const pac  = getPac(cita.pacienteId);
            if (!pac) return null;
            const conf = pagoConfig[cita.estadoPago];
            const Icon = conf.icon;
            return (
              <div key={cita.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pac.nombre}</p>
                    <p className="text-xs text-slate-400">{pac.sesionPrecio} € / sesión</p>
                  </div>
                </div>
                <div className="col-span-2 text-center text-sm text-slate-600">{cita.fecha}</div>
                <div className="col-span-2 text-center text-sm text-slate-600">{cita.hora}</div>
                <div className="col-span-2 flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${conf.color}`}>
                    <Icon className="w-3 h-3" />{conf.label}
                  </span>
                </div>
                <div className="col-span-1 text-right font-semibold text-slate-800 text-sm">{pac.sesionPrecio} €</div>
                <div className="col-span-1 flex justify-center">
                  {cita.estadoPago !== "pagado" && (
                    <button onClick={() => marcarPagado(cita.id)}
                      className="text-xs bg-violet-50 text-violet-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap">
                      ✓ Pagado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
