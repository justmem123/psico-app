"use client";
import { useState, useEffect } from "react";
import Modal from "./ui/Modal";
import PhoneInput from "./ui/PhoneInput";
import { useApp } from "@/lib/store";
import type { Paciente } from "@/lib/store";
import { Loader2, Save } from "lucide-react";

interface Props {
  paciente: Paciente | null;
  onClose: () => void;
}

const CONCEPTO_DEFECTO = "Honorarios por prestación de servicios como Psicóloga General Sanitaria";

export default function EditarPacienteModal({ paciente, onClose }: Props) {
  const { updatePaciente } = useApp();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", sesionPrecio: 60, dni: "", direccion: "", profesional: false, retencion: 15, conceptoFactura: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (paciente) setForm({
      nombre:      paciente.nombre,
      email:       paciente.email,
      telefono:    paciente.telefono,
      sesionPrecio:paciente.sesionPrecio,
      dni:         paciente.dni ?? "",
      direccion:   paciente.direccion ?? "",
      profesional: paciente.profesional ?? false,
      retencion:   paciente.profesional ? (paciente.retencion ?? 15) : 15,
      conceptoFactura: paciente.conceptoFactura || CONCEPTO_DEFECTO,
    });
  }, [paciente]);

  const set = (k: string, v: string | number | boolean) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente) return;
    setSaving(true);
    await updatePaciente(paciente.id, { ...form, retencion: form.profesional ? form.retencion : 0 });
    setSaving(false);
    onClose();
  }

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition bg-slate-50";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

  return (
    <Modal open={!!paciente} onClose={onClose} title="Editar paciente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Nombre completo *</label>
          <input type="text" className={inputCls} value={form.nombre}
            onChange={e => set("nombre", e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>DNI / NIE</label>
            <input type="text" className={inputCls} placeholder="12345678A"
              value={form.dni} onChange={e => set("dni", e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>Precio por sesión (€) *</label>
            <input type="number" className={inputCls} min={0} step="any"
              value={form.sesionPrecio} onChange={e => set("sesionPrecio", parseFloat(e.target.value) || 0)} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>Teléfono</label>
          <PhoneInput value={form.telefono} onChange={v => set("telefono", v)} />
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

        {/* Profesional que deriva pacientes (factura mensual con retención) */}
        <div className="rounded-xl border border-slate-200 p-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-violet-600" checked={form.profesional}
              onChange={e => set("profesional", e.target.checked)} />
            <span>
              <span className="block text-sm font-semibold text-slate-700">Es una profesional, no un paciente</span>
              <span className="block text-xs text-slate-400">Se le hace una factura al mes con todas las sesiones, con retención de IRPF.</span>
            </span>
          </label>
          {form.profesional && (
            <div className="mt-3 space-y-3">
              <div className="w-32">
                <label className={labelCls}>Retención IRPF (%)</label>
                <input type="number" className={inputCls} min={0} max={100} step="any"
                  value={form.retencion} onChange={e => set("retencion", parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Concepto de la factura</label>
                <input type="text" className={inputCls}
                  value={form.conceptoFactura} onChange={e => set("conceptoFactura", e.target.value)} />
                <p className="text-[11px] text-slate-400 mt-1">Se añade «en el mes de …» automáticamente.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </Modal>
  );
}
