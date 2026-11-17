"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useApp, precioCita } from "@/lib/store";
import type { Cita } from "@/lib/store";
import CitaDetailModal from "@/components/CitaDetailModal";
import FacturaModal from "@/components/FacturaModal";
import FacturaMensualModal from "@/components/FacturaMensualModal";
import FacturaProfesionalModal from "@/components/FacturaProfesionalModal";
import type { Paciente } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

// Factura ya emitida: su número queda fijo (tabla facturas)
type FacturaFija = { clave: string; numero: number; periodo: string };

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

type Periodo = "todo" | "mes" | "mes_pasado" | "trimestre" | "año" | "rango";

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "mes",        label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "trimestre",  label: "Este trimestre" },
  { value: "año",        label: "Este año" },
  { value: "todo",       label: "Todo" },
  { value: "rango",      label: "Elegir fechas" },
];

const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Rango [desde, hasta] en formato AAAA-MM-DD (vacío = sin límite)
function rangoDe(p: Periodo, desde: string, hasta: string): [string, string] {
  const hoy = new Date();
  const y = hoy.getFullYear(), m = hoy.getMonth();
  if (p === "mes")        return [iso(new Date(y, m, 1)),     iso(new Date(y, m + 1, 0))];
  if (p === "mes_pasado") return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
  if (p === "trimestre")  { const t = Math.floor(m / 3) * 3; return [iso(new Date(y, t, 1)), iso(new Date(y, t + 3, 0))]; }
  if (p === "año")        return [`${y}-01-01`, `${y}-12-31`];
  if (p === "rango")      return [desde, hasta];
  return ["", ""];
}

function tituloPeriodo(p: Periodo, [a, b]: [string, string]) {
  if (p === "todo") return "Todo el historial";
  if (p === "mes" || p === "mes_pasado") { const d = new Date(a + "T00:00:00"); return `${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`; }
  if (p === "trimestre") { const d = new Date(a + "T00:00:00"); return `${Math.floor(d.getMonth() / 3) + 1}.º trimestre de ${d.getFullYear()}`; }
  if (p === "año") return `Año ${a.slice(0, 4)}`;
  if (a && b) return `Del ${fmtFecha(a)} al ${fmtFecha(b)}`;
  if (a) return `Desde el ${fmtFecha(a)}`;
  if (b) return `Hasta el ${fmtFecha(b)}`;
  return "Elige las fechas";
}

function CobrosContent() {
  const { citas, pacientes, marcarPagado } = useApp();
  const searchParams = useSearchParams();
  const [filtro,     setFiltro]     = useState<Filtro>("todos");
  const [periodo,    setPeriodo]    = useState<Periodo>("todo");
  const [desde,      setDesde]      = useState("");
  const [hasta,      setHasta]      = useState("");
  const [pacFiltro,  setPacFiltro]  = useState("");
  const [verDetalle, setVerDetalle] = useState(false);
  const [citaSelId,  setCitaSelId]  = useState<string | null>(null);
  const [facturaCita, setFacturaCita] = useState<Cita | null>(null);
  const [facturaMensual, setFacturaMensual] = useState<{ paciente: Paciente; citas: Cita[]; periodo: string; numero: number; clave: string } | null>(null);
  const [facturaProf, setFacturaProf] = useState<{ paciente: Paciente; citas: Cita[]; mes: string; numero: string; clave: string; n: number; periodo: string } | null>(null);
  const [fijas, setFijas] = useState<FacturaFija[] | null>(null);

  useEffect(() => {
    createClient().from("facturas").select("clave, numero, periodo")
      .then(({ data }) => setFijas((data as FacturaFija[]) ?? []));
  }, []);

  // Al imprimir una factura por primera vez se guarda su número para que no cambie nunca
  async function fijarFactura(clave: string, numero: number, periodo: string, pacienteId: string) {
    if (fijas?.some(f => f.clave === clave)) return;
    const { error } = await createClient().from("facturas").insert({ clave, numero, periodo, paciente_id: pacienteId });
    if (!error) setFijas(prev => [...(prev ?? []), { clave, numero, periodo }]);
  }

  // Filtros desde la URL: ?f=pagado&p=mes&pac=<id>&desde=AAAA-MM-DD&hasta=AAAA-MM-DD&detalle=1
  useEffect(() => {
    const f = searchParams.get("f");
    if (f === "pagado" || f === "pendiente" || f === "debe") setFiltro(f);
    const p = searchParams.get("p");
    if (p && PERIODOS.some(x => x.value === p)) setPeriodo(p as Periodo);
    const d = searchParams.get("desde"), h = searchParams.get("hasta");
    if (d || h) { setPeriodo("rango"); setDesde(d ?? ""); setHasta(h ?? ""); }
    const pac = searchParams.get("pac");
    if (pac) setPacFiltro(pac);
    if (searchParams.get("detalle")) setVerDetalle(true);
  }, [searchParams]);

  const getPac = (id: string) => pacientes.find(p => p.id === id);
  const precio = (c: Cita) => precioCita(c, getPac(c.pacienteId));

  const [rDesde, rHasta] = rangoDe(periodo, desde, hasta);
  // Citas dentro del periodo y del paciente elegidos (sin mirar el estado de pago)
  const citasBase = citas.filter(c =>
    (!rDesde || c.fecha >= rDesde) && (!rHasta || c.fecha <= rHasta) &&
    (!pacFiltro || c.pacienteId === pacFiltro));

  const citasFiltradas = citasBase
    .filter(c => filtro === "todos" || c.estadoPago === filtro)
    .sort((a,b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

  const totalCobrado   = citasBase.filter(c => c.estadoPago === "pagado").reduce((s,c)    => s + precio(c), 0);
  const totalPendiente = citasBase.filter(c => c.estadoPago === "pendiente").reduce((s,c) => s + precio(c), 0);
  const totalDebe      = citasBase.filter(c => c.estadoPago === "debe").reduce((s,c)      => s + precio(c), 0);
  const nCobradas      = citasBase.filter(c => c.estadoPago === "pagado").length;

  // Detalle de lo cobrado por paciente en el periodo
  const detalle = Object.values(
    citasBase.filter(c => c.estadoPago === "pagado").reduce<Record<string, { pac: Paciente; n: number; total: number }>>((acc, c) => {
      const pac = getPac(c.pacienteId); if (!pac) return acc;
      acc[pac.id] ??= { pac, n: 0, total: 0 };
      acc[pac.id].n++; acc[pac.id].total += precioCita(c, pac);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const pacientesOrden = [...pacientes].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const hayFiltros = periodo !== "todo" || pacFiltro !== "" || filtro !== "todos";
  const pacSel = pacFiltro ? getPac(pacFiltro) : undefined;
  const fmtEur = (n: number) => `${Math.round(n * 100) / 100} €`;

  const clicTarjeta = (f: Filtro) => { setFiltro(filtro === f ? "todos" : f); if (f === "pagado") setVerDetalle(true); };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Cobros</h1>
        <p className="text-slate-400 text-sm mt-0.5">Control de pagos y facturación</p>
      </div>

      {/* Filtros de periodo y paciente */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 md:p-4 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PERIODOS.map(({ value, label }) => (
            <button key={value} onClick={() => setPeriodo(value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                periodo === value ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-500 hover:text-violet-600"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          {periodo === "rango" && (
            <>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-10">Desde</span>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700" />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-10">Hasta</span>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                  className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700" />
              </label>
            </>
          )}
          <label className={`flex items-center gap-2 text-xs text-slate-500 ${periodo === "rango" ? "" : "md:col-span-3"}`}>
            <span className="w-10">Paciente</span>
            <select value={pacFiltro} onChange={e => setPacFiltro(e.target.value)}
              className="flex-1 min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white">
              <option value="">Todos los pacientes</option>
              {pacientesOrden.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700 first-letter:uppercase truncate">
            {tituloPeriodo(periodo, [rDesde, rHasta])}{pacSel ? ` · ${pacSel.nombre}` : ""}
          </p>
          {hayFiltros && (
            <button onClick={() => { setPeriodo("todo"); setPacFiltro(""); setFiltro("todos"); setDesde(""); setHasta(""); }}
              className="flex-shrink-0 text-xs text-violet-600 font-semibold">Quitar filtros</button>
          )}
        </div>
      </div>

      {/* Stats (se pueden pulsar) */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
        <button onClick={() => clicTarjeta("pagado")}
          className={`text-left bg-white rounded-2xl border p-4 md:p-5 shadow-sm transition-all ${filtro === "pagado" ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-100 hover:border-emerald-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cobrado</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{fmtEur(totalCobrado)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{nCobradas} sesi{nCobradas === 1 ? "ón" : "ones"} · ver detalle</p>
        </button>
        <button onClick={() => clicTarjeta("pendiente")}
          className={`text-left bg-white rounded-2xl border p-4 md:p-5 shadow-sm transition-all ${filtro === "pendiente" ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-100 hover:border-amber-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Pendiente</p>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{fmtEur(totalPendiente)}</p>
        </button>
        <button onClick={() => clicTarjeta("debe")}
          className={`text-left bg-white rounded-2xl border p-4 md:p-5 shadow-sm transition-all ${filtro === "debe" ? "border-red-300 ring-2 ring-red-100" : "border-slate-100 hover:border-red-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Debe</p>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-red-600">{fmtEur(totalDebe)}</p>
        </button>
      </div>

      {/* Detalle de lo cobrado por paciente */}
      {verDetalle && filtro === "pagado" && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-100 bg-emerald-50/50">
            <p className="text-sm font-semibold text-slate-700">Cobrado por paciente</p>
            <button onClick={() => setVerDetalle(false)} className="text-xs text-slate-400 hover:text-slate-600">Ocultar</button>
          </div>
          {detalle.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No hay cobros en este periodo</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {detalle.map(({ pac, n, total }) => (
                <li key={pac.id}>
                  <button onClick={() => setPacFiltro(pacFiltro === pac.id ? "" : pac.id)}
                    className={`w-full flex items-center gap-3 px-4 md:px-5 py-2.5 text-left hover:bg-slate-50 ${pacFiltro === pac.id ? "bg-violet-50" : ""}`}>
                    <div className={`w-7 h-7 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
                      {pac.nombre.split(" ").map(x => x[0]).join("").slice(0,2)}
                    </div>
                    <span className="flex-1 min-w-0 truncate text-sm text-slate-700">{pac.nombre}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{n} sesi{n === 1 ? "ón" : "ones"}</span>
                    <span className="w-20 text-right text-sm font-bold text-emerald-600 flex-shrink-0">{fmtEur(total)}</span>
                  </button>
                </li>
              ))}
              <li className="flex items-center justify-between px-4 md:px-5 py-3 bg-slate-50">
                <span className="text-sm font-semibold text-slate-600">Total · {nCobradas} sesi{nCobradas === 1 ? "ón" : "ones"}</span>
                <span className="text-sm font-bold text-slate-800">{fmtEur(totalCobrado)}</span>
              </li>
            </ul>
          )}
        </div>
      )}

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
              ({citasBase.filter(c => value === "todos" || c.estadoPago === value).length})
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
                    <span className={`text-sm font-bold ${cita.precio != null ? "text-violet-700" : "text-slate-800"}`}>{precio(cita)} €</span>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {cita.estadoPago !== "pagado" && (
                        <button onClick={() => marcarPagado(cita.id)}
                          className="text-xs bg-violet-50 text-violet-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap">
                          ✓ Cobrado
                        </button>
                      )}
                      {cita.estadoPago === "pagado" && !pac.profesional && (
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
                  <p className={`font-bold ${cita.precio != null ? "text-violet-700" : "text-slate-800"}`}>{precio(cita)} €</p>
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
              {cita.estadoPago === "pagado" && !pac.profesional && (
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

      {/* Facturas trimestrales */}
      <div className="mt-8">
        <h2 className="text-base font-bold text-slate-800 mb-1">Facturas por trimestre</h2>
        <p className="text-xs text-slate-400 mb-4">Las profesionales (como Paula) tienen una factura por mes, con su retención de IRPF.</p>
        {(() => {
          const trimestreKey = (fecha: string) => {
            const [y, m] = fecha.slice(0, 7).split("-");
            const t = Math.ceil(parseInt(m) / 3);
            return `${y}-T${t}`;
          };
          const trimestreLabel = (key: string) => {
            const [y, t] = key.split("-");
            const labels: Record<string, string> = {
              T1: "1er Trimestre — Enero · Febrero · Marzo",
              T2: "2º Trimestre — Abril · Mayo · Junio",
              T3: "3er Trimestre — Julio · Agosto · Septiembre",
              T4: "4º Trimestre — Octubre · Noviembre · Diciembre",
            };
            return `${labels[t]} ${y}`;
          };

          // Agrupar citas pagadas por paciente + trimestre
          // Pacientes: una factura por trimestre. Profesionales (p. ej. Paula): una por mes, numerada en su trimestre.
          const grupos: Record<string, { paciente: Paciente; citas: Cita[]; periodo: string; mes?: string }> = {};
          citas
            .filter(c => c.estadoPago === "pagado")
            .forEach(c => {
              const pac = getPac(c.pacienteId);
              if (!pac) return;
              const periodo = trimestreKey(c.fecha);
              const mes = pac.profesional ? c.fecha.slice(0, 7) : undefined;
              const key = `${pac.id}-${mes ?? periodo}`;
              if (!grupos[key]) grupos[key] = { paciente: pac, citas: [], periodo, mes };
              grupos[key].citas.push(c);
            });

          const ordenadas = Object.values(grupos)
            .sort((a, b) => a.periodo.localeCompare(b.periodo) || a.paciente.nombre.localeCompare(b.paciente.nombre) || (a.mes ?? "").localeCompare(b.mes ?? ""))
            .map(g => ({ ...g, clave: `${g.paciente.id}|${g.mes ?? g.periodo}` }));
          // Las ya emitidas conservan su número; las demás toman, en orden, los números libres
          const porClave = new Map((fijas ?? []).map(f => [f.clave, f.numero]));
          const usados = new Set((fijas ?? []).map(f => f.numero));
          let siguiente = 1;
          const lista = ordenadas.map(g => {
            const fijo = porClave.get(g.clave);
            if (fijo !== undefined) return { ...g, numero: fijo, fija: true };
            while (usados.has(siguiente)) siguiente++;
            return { ...g, numero: siguiente++, fija: false };
          }).reverse();

          if (lista.length === 0) return (
            <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center text-slate-400 text-sm">
              No hay sesiones pagadas
            </div>
          );

          const nombreMes = (m: string) => `${MESES_LARGO[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
          const abrirFactura = (paciente: Paciente, cs: Cita[], p: string, numero: number, mes: string | undefined, clave: string) => {
            if (fijas === null) return;   // esperar a tener los números ya emitidos
            if (mes) {
              const [y, t] = p.split("-");
              setFacturaProf({ paciente, citas: cs, mes, numero: `FAC${y}-${t}-${String(numero).padStart(3, "0")}`, clave, n: numero, periodo: p });
            } else setFacturaMensual({ paciente, citas: cs, periodo: p, numero, clave });
          };

          const trimestresUnicos = [...new Set(lista.map(g => g.periodo))];

          return (
            <>
              {trimestresUnicos.map(periodo => {
                const gruposTrim = lista.filter(g => g.periodo === periodo);
                return (
                  <div key={periodo} className="mb-6">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{trimestreLabel(periodo)}</p>

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
                          {gruposTrim.map(({ paciente, citas: cs, periodo: p, numero, mes, clave }) => (
                            <tr key={`${paciente.id}-${p}`} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                    {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{paciente.nombre}</p>
                                    {mes && <p className="text-xs text-violet-600">Profesional · {nombreMes(mes)} · −{paciente.retencion ?? 0} % IRPF</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-slate-600">{cs.length}</td>
                              <td className="px-4 py-4 text-right font-bold text-slate-800">{cs.reduce((s, c) => s + precioCita(c, paciente), 0)} €</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => abrirFactura(paciente, cs, p, numero, mes, clave)}
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
                      {gruposTrim.map(({ paciente, citas: cs, periodo: p, numero, mes, clave }) => (
                        <div key={`${paciente.id}-${p}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${paciente.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {paciente.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">{paciente.nombre}</p>
                            {mes && <p className="text-xs text-violet-600">Profesional · {nombreMes(mes)}</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{cs.length} sesión{cs.length !== 1 ? "es" : ""} · {cs.reduce((s, c) => s + precioCita(c, paciente), 0)} €</p>
                          </div>
                          <button
                            onClick={() => abrirFactura(paciente, cs, p, numero, mes, clave)}
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
      {facturaProf && (
        <FacturaProfesionalModal paciente={facturaProf.paciente} citas={facturaProf.citas}
          mes={facturaProf.mes} numero={facturaProf.numero} onClose={() => setFacturaProf(null)}
          onImprimir={() => fijarFactura(facturaProf.clave, facturaProf.n, facturaProf.periodo, facturaProf.paciente.id)} />
      )}
      {facturaMensual && (
        <FacturaMensualModal
          paciente={facturaMensual.paciente}
          citas={facturaMensual.citas}
          periodo={facturaMensual.periodo}
          numero={facturaMensual.numero}
          onClose={() => setFacturaMensual(null)}
          onImprimir={() => fijarFactura(facturaMensual.clave, facturaMensual.numero, facturaMensual.periodo, facturaMensual.paciente.id)}
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
