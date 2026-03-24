"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { citas, getPaciente } from "@/lib/mock-data";

const HORAS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];
const DIAS  = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const estadoColor: Record<string, string> = {
  confirmada: "border-l-emerald-400 bg-emerald-50",
  pendiente:  "border-l-amber-400  bg-amber-50",
  cancelada:  "border-l-slate-300  bg-slate-50 opacity-60",
  falta:      "border-l-red-400    bg-red-50",
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export default function AgendaPage() {
  const [semana, setSemana] = useState(() => getMonday(new Date()));

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i));
  const hoy  = fmt(new Date());

  const titulo = (() => {
    const ini = dias[0];
    const fin = dias[6];
    if (ini.getMonth() === fin.getMonth()) {
      return `${ini.getDate()} – ${fin.getDate()} de ${meses[ini.getMonth()]} ${ini.getFullYear()}`;
    }
    return `${ini.getDate()} ${meses[ini.getMonth()]} – ${fin.getDate()} ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
  })();

  function getCita(dia: Date, hora: string) {
    const diaStr = fmt(dia);
    return citas.find(c => c.fecha === diaStr && c.hora === hora);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-slate-400 text-sm mt-0.5 capitalize">{titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setSemana(addDays(semana, -7))}
              className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setSemana(getMonday(new Date()))}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => setSemana(addDays(semana, 7))}
              className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <button className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" />
            Nueva cita
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Cabecera días */}
        <div className="grid grid-cols-8 border-b border-slate-100">
          <div className="py-3 px-4 text-xs text-slate-400 font-medium" />
          {dias.map((dia, i) => {
            const diaStr  = fmt(dia);
            const esHoy   = diaStr === hoy;
            const nCitas  = citas.filter(c => c.fecha === diaStr).length;
            return (
              <div key={i} className={`py-3 px-2 text-center border-l border-slate-100 ${esHoy ? "bg-violet-50" : ""}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${esHoy ? "text-violet-600" : "text-slate-400"}`}>
                  {DIAS[i]}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${esHoy ? "text-violet-700" : "text-slate-700"}`}>
                  {dia.getDate()}
                </p>
                {nCitas > 0 && (
                  <div className="flex justify-center mt-1 gap-0.5">
                    {Array.from({ length: Math.min(nCitas, 4) }).map((_, j) => (
                      <span key={j} className={`w-1 h-1 rounded-full ${esHoy ? "bg-violet-400" : "bg-slate-300"}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filas de horas */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
          {HORAS.map(hora => (
            <div key={hora} className="grid grid-cols-8 border-b border-slate-50 min-h-[64px]">
              {/* Hora */}
              <div className="py-2 px-4 flex items-start">
                <span className="text-xs text-slate-400 font-medium mt-1">{hora}</span>
              </div>
              {/* Celdas por día */}
              {dias.map((dia, i) => {
                const esHoy = fmt(dia) === hoy;
                const cita  = getCita(dia, hora);
                return (
                  <div
                    key={i}
                    className={`border-l border-slate-100 p-1.5 ${esHoy ? "bg-violet-50/30" : ""}`}
                  >
                    {cita && (() => {
                      const pac = getPaciente(cita.pacienteId);
                      return (
                        <div className={`rounded-lg border-l-4 px-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity ${estadoColor[cita.estado]}`}>
                          <p className="text-xs font-semibold text-slate-700 truncate">{pac.nombre}</p>
                          <p className="text-xs text-slate-500">{cita.hora} · {cita.duracion}'</p>
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

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-4">
        {[
          { label: "Confirmada", color: "bg-emerald-400" },
          { label: "Pendiente",  color: "bg-amber-400"   },
          { label: "Cancelada",  color: "bg-slate-300"   },
          { label: "Falta",      color: "bg-red-400"     },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
