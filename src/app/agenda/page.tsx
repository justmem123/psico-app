"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { useApp } from "@/lib/store";
import NuevaCitaModal from "@/components/NuevaCitaModal";
import CitaDetailModal from "@/components/CitaDetailModal";

type Vista = "dia" | "semana" | "mes";

const HORAS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const DIAS_CORTO  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DIAS_LARGO  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const estadoColor: Record<string, string> = {
  confirmada: "border-l-emerald-400 bg-emerald-50 text-emerald-800",
  pendiente:  "border-l-amber-400  bg-amber-50  text-amber-800",
  cancelada:  "border-l-red-400    bg-red-50    text-red-800 opacity-75",
  falta:      "border-l-red-400    bg-red-50    text-red-800 opacity-75",
};
const estadoDot: Record<string, string> = {
  confirmada: "bg-emerald-400",
  pendiente:  "bg-amber-400",
  cancelada:  "bg-red-400",
  falta:      "bg-red-400",
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0,0,0,0);
  return d;
}
function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function fmt(d: Date) { return d.toISOString().split("T")[0]; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth()+1, 0); }

export default function AgendaPage() {
  const { citas, pacientes } = useApp();
  const [vista,     setVista]     = useState<Vista>("semana");
  const [semana,    setSemana]    = useState(() => getMonday(new Date()));
  const [diaActual, setDiaActual] = useState(() => new Date());
  const [mesActual, setMesActual] = useState(() => new Date());
  const [modal,     setModal]     = useState(false);
  const [citaSelId, setCitaSelId] = useState<string | null>(null);

  const hoy = fmt(new Date());

  // ─── Navegación unificada ────────────────────────────────────────
  function navAnterior() {
    if (vista === "dia")    setDiaActual(addDays(diaActual, -1));
    if (vista === "semana") setSemana(addDays(semana, -7));
    if (vista === "mes")    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1, 1));
  }
  function navSiguiente() {
    if (vista === "dia")    setDiaActual(addDays(diaActual, 1));
    if (vista === "semana") setSemana(addDays(semana, 7));
    if (vista === "mes")    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1, 1));
  }
  function navHoy() {
    const hoyDate = new Date();
    setDiaActual(hoyDate);
    setSemana(getMonday(hoyDate));
    setMesActual(hoyDate);
  }

  // ─── Título ───────────────────────────────────────────────────────
  const titulo = (() => {
    if (vista === "dia") {
      const d = diaActual;
      return `${DIAS_LARGO[(d.getDay()+6)%7]}, ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (vista === "semana") {
      const dias = Array.from({length:7}, (_,i) => addDays(semana, i));
      const [ini, fin] = [dias[0], dias[6]];
      if (ini.getMonth() === fin.getMonth())
        return `${ini.getDate()} – ${fin.getDate()} de ${MESES[ini.getMonth()]} ${ini.getFullYear()}`;
      return `${ini.getDate()} ${MESES[ini.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]}`;
    }
    return `${MESES[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
  })();

  // ─── VISTA DÍA ────────────────────────────────────────────────────
  const citasDelDia = citas
    .filter(c => c.fecha === fmt(diaActual))
    .sort((a,b) => a.hora.localeCompare(b.hora));

  // ─── VISTA SEMANA ────────────────────────────────────────────────
  const diasSemana = Array.from({length:7}, (_,i) => addDays(semana, i));

  // ─── VISTA MES ───────────────────────────────────────────────────
  function buildMesGrid() {
    const ini = startOfMonth(mesActual);
    const fin = endOfMonth(mesActual);
    // Start from Monday of the week containing day 1
    const startDay = getMonday(ini);
    // End on Sunday of the week containing last day
    const endFin = addDays(ini, 41); // max 6 weeks
    const days: Date[] = [];
    let cur = new Date(startDay);
    while (cur <= fin || days.length % 7 !== 0) {
      days.push(new Date(cur));
      cur = addDays(cur, 1);
      if (cur > endFin && days.length % 7 === 0) break;
    }
    return days;
  }
  const mesGrid = buildMesGrid();

  return (
    <div className="p-4 md:p-6 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-slate-400 text-sm capitalize hidden sm:block">{titulo}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de vista */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            {(["dia","semana","mes"] as Vista[]).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${vista === v ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          {/* Selector vista móvil */}
          <div className="flex sm:hidden items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            {(["dia","mes"] as Vista[]).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${vista === v ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>
                {v === "dia" ? "Día" : "Mes"}
              </button>
            ))}
          </div>
          {/* Navegación */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button onClick={navAnterior} className="p-1.5 rounded-lg hover:bg-slate-50"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
            <button onClick={navHoy} className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Hoy</button>
            <button onClick={navSiguiente} className="p-1.5 rounded-lg hover:bg-slate-50"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva cita</span>
          </button>
        </div>
      </div>

      {/* ─── VISTA DÍA ─────────────────────────────────────────────── */}
      {vista === "dia" && (
        <div className="flex-1 overflow-y-auto">
          <p className="text-sm font-medium text-slate-500 mb-3 sm:hidden capitalize">{titulo}</p>
          {citasDelDia.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 py-16 flex flex-col items-center gap-3 text-center">
              <CalendarDays className="w-10 h-10 text-slate-200" />
              <p className="text-slate-400 text-sm">No hay citas este día</p>
              <button onClick={() => setModal(true)} className="text-violet-600 text-sm font-semibold hover:underline">+ Añadir cita</button>
            </div>
          ) : (
            <div className="space-y-2">
              {citasDelDia.map(cita => {
                const pac = pacientes.find(p => p.id === cita.pacienteId);
                if (!pac) return null;
                return (
                  <div key={cita.id} onClick={() => setCitaSelId(cita.id)}
                    className={`flex items-center gap-4 bg-white rounded-xl border-l-4 px-4 py-3.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${estadoColor[cita.estado]}`}>
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-sm font-bold">{cita.hora}</p>
                      <p className="text-xs opacity-60">{cita.duracion}'</p>
                    </div>
                    <div className={`w-9 h-9 rounded-full ${pac.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{pac.nombre}</p>
                      <p className="text-xs opacity-60">{pac.sesionPrecio} €</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── VISTA SEMANA ───────────────────────────────────────────── */}
      {vista === "semana" && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          {/* Cabecera días */}
          <div className="grid grid-cols-8 border-b border-slate-100 flex-shrink-0">
            <div className="py-3 px-3 text-xs text-slate-400 font-medium" />
            {diasSemana.map((dia, i) => {
              const esHoy  = fmt(dia) === hoy;
              const nCitas = citas.filter(c => c.fecha === fmt(dia)).length;
              return (
                <div key={i} onClick={() => { setDiaActual(dia); setVista("dia"); }}
                  className={`py-3 px-1 text-center border-l border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${esHoy ? "bg-violet-50" : ""}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${esHoy ? "text-violet-600" : "text-slate-400"}`}>{DIAS_CORTO[i]}</p>
                  <p className={`text-base font-bold mt-0.5 ${esHoy ? "text-violet-700" : "text-slate-700"}`}>{dia.getDate()}</p>
                  {nCitas > 0 && (
                    <div className="flex justify-center mt-1 gap-0.5">
                      {Array.from({length: Math.min(nCitas,4)}).map((_,j) => (
                        <span key={j} className={`w-1 h-1 rounded-full ${esHoy ? "bg-violet-400" : "bg-slate-300"}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Grid horas */}
          <div className="overflow-y-auto flex-1">
            {HORAS.map(hora => (
              <div key={hora} className="grid grid-cols-8 border-b border-slate-50 min-h-[60px]">
                <div className="py-2 px-3 flex items-start">
                  <span className="text-xs text-slate-400 font-medium mt-1">{hora}</span>
                </div>
                {diasSemana.map((dia, i) => {
                  const esHoy = fmt(dia) === hoy;
                  const cita  = citas.find(c => c.fecha === fmt(dia) && c.hora === hora);
                  return (
                    <div key={i} className={`border-l border-slate-100 p-1 ${esHoy ? "bg-violet-50/30" : ""}`}>
                      {cita && (() => {
                        const pac = pacientes.find(p => p.id === cita.pacienteId);
                        if (!pac) return null;
                        return (
                          <div onClick={() => setCitaSelId(cita.id)}
                            className={`rounded-lg border-l-4 px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity ${estadoColor[cita.estado]}`}>
                            <p className="text-xs font-semibold truncate">{pac.nombre.split(" ")[0]}</p>
                            <p className="text-xs opacity-60">{cita.duracion}'</p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── VISTA MES ──────────────────────────────────────────────── */}
      {vista === "mes" && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          {/* Cabecera días semana */}
          <div className="grid grid-cols-7 border-b border-slate-100 flex-shrink-0">
            {DIAS_CORTO.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>
          {/* Grid días */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7 h-full">
              {mesGrid.map((dia, idx) => {
                const esMesActual = dia.getMonth() === mesActual.getMonth();
                const esHoy       = fmt(dia) === hoy;
                const citasDia    = citas.filter(c => c.fecha === fmt(dia)).sort((a,b) => a.hora.localeCompare(b.hora));
                return (
                  <div key={idx}
                    className={`border-b border-r border-slate-100 p-1.5 min-h-[90px] cursor-pointer hover:bg-slate-50 transition-colors ${!esMesActual ? "bg-slate-50/50" : ""}`}
                    onClick={() => { setDiaActual(dia); setVista("dia"); }}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        esHoy ? "bg-violet-600 text-white" : esMesActual ? "text-slate-700" : "text-slate-300"
                      }`}>{dia.getDate()}</span>
                    </div>
                    <div className="space-y-0.5">
                      {citasDia.slice(0,3).map(cita => {
                        const pac = pacientes.find(p => p.id === cita.pacienteId);
                        if (!pac) return null;
                        return (
                          <div key={cita.id} onClick={e => { e.stopPropagation(); setCitaSelId(cita.id); }}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 hover:bg-violet-100 transition-colors">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${estadoDot[cita.estado]}`} />
                            <span className="text-xs font-medium text-violet-700 truncate hidden sm:block">{pac.nombre.split(" ")[0]}</span>
                            <span className="text-xs text-violet-500 flex-shrink-0">{cita.hora}</span>
                          </div>
                        );
                      })}
                      {citasDia.length > 3 && (
                        <p className="text-xs text-slate-400 pl-1">+{citasDia.length - 3} más</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 flex-shrink-0">
        {[{label:"Confirmada",color:"bg-emerald-400"},{label:"Pendiente",color:"bg-amber-400"},{label:"Cancelada",color:"bg-red-400"}].map(({label,color}) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      <NuevaCitaModal open={modal} onClose={() => setModal(false)} />
      <CitaDetailModal citaId={citaSelId} onClose={() => setCitaSelId(null)} />
    </div>
  );
}
