"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { TrendingUp, TrendingDown, Users, CalendarDays, XCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";

type Periodo = "mes_actual" | "mes_pasado" | "3_meses" | "6_meses" | "año_actual" | "todo";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "mes_actual",  label: "Este mes"       },
  { value: "mes_pasado",  label: "Mes pasado"     },
  { value: "3_meses",     label: "Últimos 3 meses"},
  { value: "6_meses",     label: "Últimos 6 meses"},
  { value: "año_actual",  label: "Este año"       },
  { value: "todo",        label: "Todo"           },
];

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getRangoFechas(periodo: Periodo): { desde: Date; hasta: Date } {
  const hoy   = new Date();
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

  if (periodo === "mes_actual") {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1), hasta };
  }
  if (periodo === "mes_pasado") {
    const ini = new Date(hoy.getFullYear(), hoy.getMonth()-1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59);
    return { desde: ini, hasta: fin };
  }
  if (periodo === "3_meses") {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth()-2, 1), hasta };
  }
  if (periodo === "6_meses") {
    return { desde: new Date(hoy.getFullYear(), hoy.getMonth()-5, 1), hasta };
  }
  if (periodo === "año_actual") {
    return { desde: new Date(hoy.getFullYear(), 0, 1), hasta };
  }
  return { desde: new Date(2000, 0, 1), hasta };
}

export default function EstadisticasPage() {
  const { citas, pacientes } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>("mes_actual");

  const { desde, hasta } = getRangoFechas(periodo);

  const citasPeriodo = useMemo(() =>
    citas.filter(c => {
      const d = new Date(c.fecha + "T00:00:00");
      return d >= desde && d <= hasta;
    }),
  [citas, desde, hasta]);

  // ── KPIs ────────────────────────────────────────────────────────
  const ingresosCobrados = citasPeriodo
    .filter(c => c.estadoPago === "pagado")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  const ingresosPendientes = citasPeriodo
    .filter(c => c.estadoPago === "pendiente")
    .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);

  const sesionesRealizadas = citasPeriodo.filter(c => c.estado === "confirmada").length;
  const sesionesCanceladas = citasPeriodo.filter(c => c.estado === "cancelada" || c.estado === "falta").length;
  const totalSesiones      = citasPeriodo.length;
  const tasaAsistencia     = totalSesiones > 0 ? Math.round((sesionesRealizadas / totalSesiones) * 100) : 0;
  const tasaCancelacion    = totalSesiones > 0 ? Math.round((sesionesCanceladas / totalSesiones) * 100) : 0;

  // ── Ingresos por mes (últimos 6 meses) ──────────────────────────
  const hoy = new Date();
  const mesesGrafica = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
    return { mes: d.getMonth(), año: d.getFullYear(), label: MESES_CORTO[d.getMonth()] };
  });
  const ingresosPorMes = mesesGrafica.map(({ mes, año, label }) => {
    const total = citas
      .filter(c => {
        const d = new Date(c.fecha + "T00:00:00");
        return d.getMonth() === mes && d.getFullYear() === año && c.estadoPago === "pagado";
      })
      .reduce((s,c) => s + (pacientes.find(p => p.id === c.pacienteId)?.sesionPrecio ?? 0), 0);
    return { label, total };
  });
  const maxIngreso = Math.max(...ingresosPorMes.map(m => m.total), 1);

  // ── Sesiones por mes ─────────────────────────────────────────────
  const sesionesPorMes = mesesGrafica.map(({ mes, año, label }) => {
    const total = citas.filter(c => {
      const d = new Date(c.fecha + "T00:00:00");
      return d.getMonth() === mes && d.getFullYear() === año && c.estado === "confirmada";
    }).length;
    return { label, total };
  });
  const maxSesiones = Math.max(...sesionesPorMes.map(m => m.total), 1);

  // ── Top pacientes ────────────────────────────────────────────────
  const topPacientes = pacientes
    .map(p => ({
      ...p,
      sesiones:  citasPeriodo.filter(c => c.pacienteId === p.id && c.estado === "confirmada").length,
      ingresos:  citasPeriodo.filter(c => c.pacienteId === p.id && c.estadoPago === "pagado").length * p.sesionPrecio,
      pendiente: citasPeriodo.filter(c => c.pacienteId === p.id && c.estadoPago === "pendiente").length * p.sesionPrecio,
    }))
    .filter(p => p.sesiones > 0 || p.pendiente > 0)
    .sort((a,b) => b.sesiones - a.sesiones)
    .slice(0, 8);

  // ── Cobros pendientes por paciente ───────────────────────────────
  const cobrosPendientes = pacientes
    .map(p => ({
      ...p,
      monto: citas.filter(c => c.pacienteId === p.id && c.estadoPago === "pendiente")
                  .length * p.sesionPrecio,
      citas: citas.filter(c => c.pacienteId === p.id && c.estadoPago === "pendiente").length,
    }))
    .filter(p => p.monto > 0)
    .sort((a,b) => b.monto - a.monto);

  const totalPendienteGlobal = cobrosPendientes.reduce((s,p) => s + p.monto, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Estadísticas</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resumen de tu práctica profesional</p>
        </div>
      </div>

      {/* Selector período */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {PERIODOS.map(({ value, label }) => (
          <button key={value} onClick={() => setPeriodo(value)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              periodo === value
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800">{ingresosCobrados} €</p>
          <p className="text-xs text-slate-400 mt-0.5">Ingresos cobrados</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800">{ingresosPendientes} €</p>
          <p className="text-xs text-slate-400 mt-0.5">Pendiente de cobro</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center mb-3">
            <CalendarDays className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800">{sesionesRealizadas}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sesiones realizadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800">{sesionesCanceladas}</p>
          <p className="text-xs text-slate-400 mt-0.5">Canceladas / faltas</p>
        </div>
      </div>

      {/* Tasas */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-600">Tasa de asistencia</p>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-3xl font-bold text-emerald-600">{tasaAsistencia}%</p>
            <p className="text-xs text-slate-400 mb-1">{sesionesRealizadas} de {totalSesiones} citas</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${tasaAsistencia}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-600">Tasa de cancelación</p>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <p className="text-3xl font-bold text-red-500">{tasaCancelacion}%</p>
            <p className="text-xs text-slate-400 mb-1">{sesionesCanceladas} de {totalSesiones} citas</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${tasaCancelacion}%` }} />
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Ingresos por mes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Ingresos cobrados — últimos 6 meses</p>
          <div className="flex items-end gap-2 h-32">
            {ingresosPorMes.map(({ label, total }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-slate-600">{total > 0 ? `${total}€` : ""}</p>
                <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: "80px" }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-violet-500 rounded-t-lg transition-all"
                    style={{ height: `${(total / maxIngreso) * 80}px` }} />
                </div>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sesiones por mes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Sesiones realizadas — últimos 6 meses</p>
          <div className="flex items-end gap-2 h-32">
            {sesionesPorMes.map(({ label, total }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-slate-600">{total > 0 ? total : ""}</p>
                <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: "80px" }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-emerald-400 rounded-t-lg transition-all"
                    style={{ height: `${(total / maxSesiones) * 80}px` }} />
                </div>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pacientes y cobros pendientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top pacientes */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <p className="text-sm font-semibold text-slate-700">Pacientes — sesiones en el período</p>
          </div>
          <div className="divide-y divide-slate-50">
            {topPacientes.length === 0 && (
              <p className="text-center text-slate-400 py-10 text-sm">Sin datos en este período</p>
            )}
            {topPacientes.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {p.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.sesiones} sesiones</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{p.ingresos} €</p>
                  {p.pendiente > 0 && <p className="text-xs text-amber-500">{p.pendiente} € pdte.</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cobros pendientes */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-slate-700">Cobros pendientes (total)</p>
            </div>
            {totalPendienteGlobal > 0 && (
              <span className="text-sm font-bold text-amber-600">{totalPendienteGlobal} €</span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {cobrosPendientes.length === 0 && (
              <p className="text-center text-slate-400 py-10 text-sm">Todo cobrado ✓</p>
            )}
            {cobrosPendientes.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {p.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.citas} {p.citas === 1 ? "sesión" : "sesiones"} sin cobrar</p>
                </div>
                <p className="text-sm font-bold text-amber-600 flex-shrink-0">{p.monto} €</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
