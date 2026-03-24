"use client";
import { useState } from "react";
import Modal from "./ui/Modal";
import PhoneInput from "./ui/PhoneInput";
import { useApp } from "@/lib/store";

interface Props { open: boolean; onClose: () => void; }

export default function NuevoPacienteModal({ open, onClose }: Props) {
  const { addPaciente } = useApp();
  const [form, setForm] = useState({
    nombre: "", email: "", telefono: "", sesionPrecio: 60, dni: "", direccion: ""
  });
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addPaciente(form);
    onClose();
    setForm({ nombre: "", email: "", telefono: "", sesionPrecio: 60, dni: "", direccion: "" });
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-slate-50";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <Modal open={open} onClose={onClose} title="Nuevo paciente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Nombre completo *</label>
          <input type="text" className={inputCls} placeholder="Ej: María García López"
            value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>DNI / NIE</label>
            <input type="text" className={inputCls} placeholder="12345678A"
              value={form.dni} onChange={e => set("dni", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>Precio por sesión (€) *</label>
            <input type="number" className={inputCls} min={0} step={5}
              value={form.sesionPrecio} onChange={e => set("sesionPrecio", parseInt(e.target.value))} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Teléfono *</label>
          <PhoneInput value={form.telefono} onChange={v => set("telefono", v)} required />
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input type="email" className={inputCls} placeholder="paciente@email.com"
            value={form.email} onChange={e => set("email", e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>Dirección</label>
          <input type="text" className={inputCls} placeholder="Calle, número, ciudad..."
            value={form.direccion} onChange={e => set("direccion", e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            Añadir paciente
          </button>
        </div>
      </form>
    </Modal>
  );
}
