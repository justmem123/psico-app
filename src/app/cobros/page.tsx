"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Cita } from "@/lib/store";
import CitaDetailModal from "@/components/CitaDetailModal";
import FacturaModal from "@/components/FacturaModal";
import FacturaMensualModal from "@/components/FacturaMensualModal";
import type { Paciente } from "@/lib/store";

type Filtro = "todos" | "pendiente" | "pagado" | "debe";

const filtroOpciones: { value: Filtro; label: string; color: string }[] = [
  { value: "todos",     label: "Todos",     color: "" },
  { value: "pendiente", label: "Pendiente", color: "text-amber-600" },
  { value: "debe",      label: "Debe",      color: "text-red-600" },
  { value: "pagado",    label: "Pagado",    color: "text-emerald-600" },
];

const pagoConfig = {
  pagado:    { label: "Pagado",    color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400", icon: CheckCircle },
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700",     dot: "bg-amber-400",   icon: Clock       },
  debe:      { label: "Debe",      color: "bg-red-100 text-red-600",         dot: "bg-red-400",     icon: AlertCircle },
};

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fmtFecha(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function CobrosContent() {
  const { citas, pacientes, marcarPagado } = useApp();
  const searchParams = useSearchParams();
  const [filtro,     setFiltro]     = useState<Filtro>("todos");
  const [citaSelId,  setCitaSelId]  = useState<string | null>(null);
  const [facturaCita, setFacturaCita] = useState<Cita | null>(null);
  const [facturaMensual, setFacturaMensual] = useState<{ paciente: Paciente; citas: Cita[]; mes: string } | null>(null);

  useEffect(() => {
    const f = searchParams.get("f");
    if (f === "pagado" || f === "pendiente" || f === "debe") setFiltro(f);
  }, [searchParams]);

  const getPac = (id: string) => pacientes.find(p => p.id === id);

  const citasFiltradas = citas
    .filter(c => filtro === "todos" || c.estadoPago === filtro)
    .sort((a,b) => b.fecha.localeCompare(a.fecha));

  const totalCobrado   = citas.filter(c => c.estadoPago === "pagado").reduce((s,c)   => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);
  const totalPendiente = citas.filter(c => c.estadoPago === "pendiente").reduce((s,c) => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);
  const totalDebe      = citas.filter(c => c.estadoPago === "debe").reduce((s,c)      => s + (getPac(c.pacienteId)?.sesionPrecio ?? 0), 0);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Cobros</h1>
        <p className="text-slate-400 text-sm mt-0.5">Control de pagos y facturación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cobrado</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{totalCobrado} €</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pendiente</p>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{totalPendiente} €</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Debe</p>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-red-600">{totalDebe} €</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {filtroOpciones.map(({ value, label }) => (
          <button key={value} onClick={() => setFiltro(value)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtro === value
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600"
            }`}>
            {label}
            <span className="ml-1.5 text-xs opacity-70">
              ({citas.filter(c => value === "todos" || c.estadoPago === value).length})
            </span>
          </button>
        ))}
        <span className="ml-auto flex-shrink-0 text-xs text-slate-400">{citasFiltradas.length} registros</span>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paciente</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora</th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe</th>
              <th className="text-center px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {citasFiltradas.length === 0 && (
              <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-sm">No hay registros</td></tr>
            )}
            {citasFiltradas.map(cita => {
              const pac  = getPac(cita.pacienteId);
              if (!pac) return null;
              const conf = pagoConfig[cita.estadoPago];
              const Icon = conf.icon;
              return (
                <tr key={cita.id} onClick={() => setCitaSelId(cita.id)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{pac.nombre}</p>
                        <p className="text-xs text-slate-400">{pac.sesionPrecio} € / sesión</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">{fmtFecha(cita.fecha)}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{cita.hora}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${conf.color}`}>
                        <Icon className="w-3 h-3" />{conf.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-slate-800">{pac.sesionPrecio} €</span>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {cita.estadoPago !== "pagado" && (
                        <button onClick={() => marcarPagado(cita.id)}
                          className="text-xs bg-violet-50 text-violet-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap">
                          ✓ Cobrado
                        </button>
                      )}
                      {cita.estadoPago === "pagado" && (
                        <button onClick={() => setFacturaCita(cita)}
                          className="flex items-center gap-1 text-xs bg-slate-50 text-slate-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap">
                          <FileText className="w-3 h-3" /> Factura
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards móvil */}
      <div className="md:hidden space-y-3">
        {citasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">
            No hay registros
          </div>
        )}
        {citasFiltradas.map(cita => {
          const pac  = getPac(cita.pacienteId);
          if (!pac) return null;
          const conf = pagoConfig[cita.estadoPago];
          const Icon = conf.icon;
          return (
            <div key={cita.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4" onClick={() => setCitaSelId(cita.id)}>
                <div className={`w-10 h-10 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{pac.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtFecha(cita.fecha)} · {cita.hora}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{pac.sesionPrecio} €</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${conf.color}`}>
                    <Icon className="w-3 h-3" />{conf.label}
                  </span>
                </div>
              </div>
              {(cita.estadoPago !== "pagado") && (
                <div className="border-t border-slate-100 px-4 py-2.5 flex gap-2">
                  <button onClick={() => marcarPagado(cita.id)}
                    className="flex-1 text-xs bg-violet-50 text-violet-600 font-semibold py-2 rounded-lg hover:bg-violet-100 transition-colors">
                    ✓ Marcar cobrado
                  </button>
                </div>
              )}
              {cita.estadoPago === "pagado" && (
                <div className="border-t border-slate-100 px-4 py-2.5">
                  <button onClick={() => setFacturaCita(cita)}
                    className="flex items-center justify-center gap-1.5 w-full text-xs bg-slate-50 text-slate-600 font-semibold py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Generar factura
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Facturas mensuales */}
      <div className="mt-8">
        <h2 className="text-base font-bold text-slate-800 mb-4">Facturas por mes</h2>
        {(() => {
          // Agrupar citas pagadas por paciente + mes
          const grupos: Record<string, { paciente: Paciente; citas: Cita[]; mes: string }> = {};
          citas
            .filter(c => c.estadoPago === "pagado")
            .forEach(c => {
              const pac = getPac(c.pacienteId);
              if (!pac) return;
              const mes = c.fecha.slice(0, 7); // "2026-01"
              const key = `${pac.id}-${mes}`;
              if (!grupos[key]) grupos[key] = { paciente: pac, citas: [], mes };
              grupos[key].citas.push(c);
            });

          const lista = Object.values(grupos).sort((a, b) =>
            b.mes.localeCompare(a.mes) || a.paciente.nombre.localeCompare(b.paciente.nombre)
          );

          if (lista.length === 0) return (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">
              No hay sesiones pagadas
            </div>
          );

          const [year, month] = lista[0]?.mes.split("-") ?? [];
          const mesActual = lista[0]?.mes;
          const mesesUnicos = [...new Set(lista.map(g => g.mes))];

          return (
            <>
              {mesesUnicos.map(mes => {
                const [y, m] = mes.split("-");
                const mesLabel = `${MESES[parseInt(m) - 1]} ${y}`;
                const gruposMes = lista.filter(g => g.mes === mes);
                return (
                  <div key={mes} className="mb-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{mesLabel}</p>

                    {/* Desktop */}
                    <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Paciente</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sesiones</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                            <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Factura</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {gruposMes.map(({ paciente, citas: cs, mes: m2 }) => (
                            <tr key={`${paciente.id}-${m2}`} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                    {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <p className="text-sm font-semibold text-slate-800">{paciente.nombre}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-slate-600">{cs.length}</td>
                              <td className="px-4 py-4 text-right font-bold text-slate-800">{cs.length * paciente.sesionPrecio} €</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setFacturaMensual({ paciente, citas: cs, mes: m2 })}
                                  className="flex items-center gap-1 text-xs bg-violet-50 text-violet-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors mx-auto whitespace-nowrap">
                                  <FileText className="w-3 h-3" /> Generar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Móvil */}
                    <div className="md:hidden space-y-3">
                      {gruposMes.map(({ paciente, citas: cs, mes: m2 }) => (
                        <div key={`${paciente.id}-${m2}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{paciente.nombre}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{cs.length} sesión{cs.length !== 1 ? "es" : ""} · {cs.length * paciente.sesionPrecio} €</p>
                          </div>
                          <button
                            onClick={() => setFacturaMensual({ paciente, citas: cs, mes: m2 })}
                            className="flex items-center gap-1 text-xs bg-violet-50 text-violet-600 font-semibold px-3 py-2 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap">
                            <FileText className="w-3 h-3" /> Factura
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      <CitaDetailModal citaId={citaSelId} onClose={() => setCitaSelId(null)} />
      {facturaCita && <FacturaModal cita={facturaCita} onClose={() => setFacturaCita(null)} />}
      {facturaMensual && (
        <FacturaMensualModal
          paciente={facturaMensual.paciente}
          citas={facturaMensual.citas}
          mes={facturaMensual.mes}
          onClose={() => setFacturaMensual(null)}
        />
      )}
    </div>
  );
}

export default function CobrosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Cargando...</div>}>
      <CobrosContent />
    </Suspense>
  );
}
