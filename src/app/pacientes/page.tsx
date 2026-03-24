"use client";
import { useState } from "react";
import { Search, Plus, Phone, Mail, CalendarDays, CreditCard, ChevronRight, MapPin, CreditCard as IdCard, Pencil } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Paciente } from "@/lib/store";
import NuevoPacienteModal from "@/components/NuevoPacienteModal";
import EditarPacienteModal from "@/components/EditarPacienteModal";

const estadoPagoColor: Record<string,string> = {
  pagado:    "bg-emerald-100 text-emerald-700",
  pendiente: "bg-amber-100 text-amber-700",
  debe:      "bg-red-100 text-red-600",
};
const estadoCitaColor: Record<string,string> = {
  confirmada: "bg-emerald-100 text-emerald-700",
  pendiente:  "bg-amber-100 text-amber-700",
  cancelada:  "bg-slate-100 text-slate-500",
  falta:      "bg-red-100 text-red-600",
};

export default function PacientesPage() {
  const { pacientes, citas } = useApp();
  const [busqueda,     setBusqueda]     = useState("");
  const [seleccionado, setSeleccionado] = useState<string|null>(null);
  const [modal,        setModal]        = useState(false);
  const [editando,     setEditando]     = useState<Paciente | null>(null);

  const filtrados        = pacientes.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const pacienteActivo   = seleccionado ? pacientes.find(p => p.id === seleccionado) : null;
  const citasPaciente    = seleccionado ? citas.filter(c => c.pacienteId === seleccionado).sort((a,b) => b.fecha.localeCompare(a.fecha)) : [];
  const totalCobrado     = citasPaciente.filter(c => c.estadoPago === "pagado").reduce((s,_) => s + (pacienteActivo?.sesionPrecio ?? 0), 0);
  const totalPendiente   = citasPaciente.filter(c => c.estadoPago !== "pagado").reduce((s,_) => s + (pacienteActivo?.sesionPrecio ?? 0), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pacientes.length} pacientes activos</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-violet-600 text-white px-3 md:px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo paciente</span><span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar paciente..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition" />
            </div>
          </div>
          <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
            {filtrados.map(p => {
              const nCitas = citas.filter(c => c.pacienteId === p.id).length;
              const activo = seleccionado === p.id;
              return (
                <button key={p.id} onClick={() => setSeleccionado(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-slate-50 transition-colors text-left ${activo ? "bg-violet-50" : ""}`}>
                  <div className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {p.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${activo ? "text-violet-700" : "text-slate-800"}`}>{p.nombre}</p>
                    <p className="text-xs text-slate-400">{nCitas} sesiones · {p.sesionPrecio} €/sesión</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${activo ? "text-violet-400" : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          {!pacienteActivo ? (
            <div className="bg-white rounded-2xl border border-slate-100 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-7 h-7 text-slate-400" />
                </div>
                <p className="font-medium text-slate-500">Selecciona un paciente</p>
                <p className="text-sm text-slate-400 mt-1">para ver su ficha completa</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${pacienteActivo.color} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {pacienteActivo.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-slate-800 truncate">{pacienteActivo.nombre}</h2>
                    <p className="text-slate-400 text-sm">Paciente activo</p>
                  </div>
                  <button onClick={() => setEditando(pacienteActivo)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors flex-shrink-0">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="truncate">{pacienteActivo.telefono || "—"}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="truncate">{pacienteActivo.email || "—"}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><IdCard className="w-4 h-4 text-slate-400 flex-shrink-0" /><span>{pacienteActivo.dni || "Sin DNI"}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600"><CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />{pacienteActivo.sesionPrecio} € / sesión</div>
                  {pacienteActivo.direccion && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2"><MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="truncate">{pacienteActivo.direccion}</span></div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="w-4 h-4 text-slate-400 flex-shrink-0" />{citasPaciente.length} sesiones en total</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Total cobrado</p>
                  <p className="text-2xl font-bold text-emerald-700">{totalCobrado} €</p>
                </div>
                <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Pendiente cobro</p>
                  <p className="text-2xl font-bold text-amber-700">{totalPendiente} €</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Historial de sesiones</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {citasPaciente.map(cita => (
                    <div key={cita.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="text-center min-w-[48px]">
                        <p className="text-xs font-bold text-slate-700">{cita.hora}</p>
                        <p className="text-xs text-slate-400">{cita.fecha}</p>
                      </div>
                      <div className="flex-1" />
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCitaColor[cita.estado]}`}>{cita.estado}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoPagoColor[cita.estadoPago]}`}>
                        {cita.estadoPago === "pagado" ? `${pacienteActivo.sesionPrecio} €` : cita.estadoPago}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <NuevoPacienteModal open={modal} onClose={() => setModal(false)} />
      <EditarPacienteModal paciente={editando} onClose={() => setEditando(null)} />
    </div>
  );
}
