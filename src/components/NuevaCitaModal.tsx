"use client";
import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import { useApp } from "@/lib/store";

interface Props { open: boolean; onClose: () => void; fechaInicial?: string; horaInicial?: string; }

export default function NuevaCitaModal({ open, onClose, fechaInicial, horaInicial }: Props) {
  const { pacientes, addCita } = useApp();
  const [form, setForm] = useState({
    pacienteId: "",
    fecha:      fechaInicial ?? new Date().toISOString().split("T")[0],
    hora:       horaInicial ?? "09:00",
    duracion:   50,
    notas:      "",
  });

  useEffect(() => {
    if (open) setForm(p => ({
      ...p,
      fecha: fechaInicial ?? p.fecha,
      hora:  horaInicial  ?? p.hora,
    }));
  }, [open, fechaInicial, horaInicial]);

  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pacienteId) return;
    addCita({ ...form, estado: "pendiente", estadoPago: "pendiente" });
    onClose();
    setForm(p => ({ ...p, pacienteId: "", notas: "" }));
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-slate-50";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <Modal open={open} onClose={onClose} title="Nueva cita">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Paciente</label>
          <select className={inputCls} value={form.pacienteId} onChange={e => set("pacienteId", e.target.value)} required>
            <option value="">Selecciona un paciente</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fecha</label>
            <input type="date" className={inputCls} value={form.fecha} onChange={e => set("fecha", e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Hora</label>
            <input type="time" className={inputCls} value={form.hora} onChange={e => set("hora", e.target.value)} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Duración (minutos)</label>
          <select className={inputCls} value={form.duracion} onChange={e => set("duracion", parseInt(e.target.value))}>
            <option value={50}>50 minutos</option>
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos (pareja)</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Notas (opcional)</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Observaciones de la sesión..."
            value={form.notas}
            onChange={e => set("notas", e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            Crear cita
          </button>
        </div>
      </form>
    </Modal>
  );
}
