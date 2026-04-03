"use client";
import { useState, useEffect } from "react";
import { Phone, Mail, Clock, Calendar, Euro, FileText, Trash2, CheckCircle, XCircle, HelpCircle, Loader2, Pencil } from "lucide-react";
import Modal from "./ui/Modal";
import FacturaModal from "./FacturaModal";
import { useApp } from "@/lib/store";
import type { Cita, EstadoCita, EstadoPago } from "@/lib/store";

interface Props {
  citaId: string | null;
  onClose: () => void;
}

const ESTADOS: { value: EstadoCita; label: string; color: string; icon: React.ElementType }[] = [
  { value: "confirmada", label: "Confirmada", color: "bg-emerald-100 text-emerald-700 ring-emerald-300", icon: CheckCircle },
  { value: "pendiente",  label: "Pendiente",  color: "bg-amber-100 text-amber-700 ring-amber-300",       icon: HelpCircle  },
  { value: "cancelada",  label: "Cancelada",  color: "bg-red-100 text-red-600 ring-red-300",             icon: XCircle     },
];

const PAGOS: { value: EstadoPago; label: string; color: string }[] = [
  { value: "pagado",    label: "Pagado",    color: "bg-emerald-100 text-emerald-700 ring-emerald-300" },
  { value: "pendiente", label: "Pendiente", color: "bg-amber-100 text-amber-700 ring-amber-300"       },
];

const DIAS   = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESES  = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fmtFecha(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function CitaDetailModal({ citaId, onClose }: Props) {
  const { citas, pacientes, updateCita, deleteCita } = useApp();
  const cita = citas.find(c => c.id === citaId) ?? null;
  const [notas,     setNotas]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [confirm,   setConfirm]   = useState(false);
  const [factura,   setFactura]   = useState(false);
  const [editando,  setEditando]  = useState(false);
  const [editFecha, setEditFecha] = useState("");
  const [editHora,  setEditHora]  = useState("");
  const [editDur,   setEditDur]   = useState("");

  const pac = cita ? pacientes.find(p => p.id === cita.pacienteId) : null;

  useEffect(() => {
    if (cita) {
      setNotas(cita.notas ?? "");
      setEditFecha(cita.fecha);
      setEditHora(cita.hora);
      setEditDur(String(cita.duracion));
    }
  }, [cita]);

  if (!cita || !pac) return null;

  async function handleEstado(estado: EstadoCita) {
    await updateCita(cita!.id, { estado });
  }

  async function handlePago(estadoPago: EstadoPago) {
    await updateCita(cita!.id, { estadoPago });
  }

  async function handleGuardarEdicion() {
    setSaving(true);
    await updateCita(cita!.id, { fecha: editFecha, hora: editHora, duracion: Number(editDur) });
    setSaving(false);
    setEditando(false);
  }

  async function handleGuardarNotas() {
    setSaving(true);
    await updateCita(cita!.id, { notas });
    setSaving(false);
  }

  async function handleEliminar() {
    setDeleting(true);
    await deleteCita(cita!.id);
    setDeleting(false);
    onClose();
  }

  const initials = pac.nombre.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
  const estadoActual = ESTADOS.find(e => e.value === cita.estado)
    ?? { label: "Cancelada", color: "bg-red-100 text-red-600 ring-red-300", icon: XCircle };
  const EstIcon = estadoActual.icon;

  return (
    <>
    <Modal open={!!citaId} onClose={onClose} title="Detalle de cita">
      {/* Paciente */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
        <div className={`w-12 h-12 rounded-full ${pac.color ?? "bg-violet-400"} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800">{pac.nombre}</p>
          <div className="flex items-center gap-3 mt-1">
            {pac.telefono && (
              <a href={`tel:${pac.telefono}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition-colors">
                <Phone className="w-3 h-3" />{pac.telefono}
              </a>
            )}
            {pac.email && (
              <a href={`mailto:${pac.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-violet-600 transition-colors">
                <Mail className="w-3 h-3" />{pac.email}
              </a>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${estadoActual.color}`}>
          <EstIcon className="w-3.5 h-3.5" />{estadoActual.label}
        </div>
      </div>

      {/* Info de la cita */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500 capitalize">{fmtFecha(cita.fecha)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-700">{cita.hora}</p>
          <p className="text-xs text-slate-400">{cita.duracion} min</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <Euro className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-700">{pac.sesionPrecio} €</p>
          <p className="text-xs text-slate-400">sesión</p>
        </div>
      </div>

      {/* Editar fecha/hora/duración */}
      {!editando ? (
        <div className="mb-5">
          <button onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Editar fecha / hora / duración
          </button>
        </div>
      ) : (
        <div className="mb-5 bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Editar cita</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fecha</label>
              <input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Hora</label>
              <input type="time" value={editHora} onChange={e => setEditHora(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Duración (min)</label>
              <input type="number" value={editDur} onChange={e => setEditDur(e.target.value)} min={15} step={5}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleGuardarEdicion} disabled={saving}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Guardar
            </button>
            <button onClick={() => { setEditando(false); setEditFecha(cita.fecha); setEditHora(cita.hora); setEditDur(String(cita.duracion)); }}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Estado de asistencia */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado de asistencia</p>
        <div className="grid grid-cols-4 gap-2">
          {ESTADOS.map(({ value, label, color, icon: Icon }) => (
            <button key={value} onClick={() => handleEstado(value)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all border-2 ${
                cita.estado === value
                  ? `${color} ring-2 border-transparent`
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Estado de pago */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Estado de pago</p>
        <div className="grid grid-cols-3 gap-2">
          {PAGOS.map(({ value, label, color }) => (
            <button key={value} onClick={() => handlePago(value)}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all border-2 ${
                cita.estadoPago === value
                  ? `${color} ring-2 border-transparent`
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" /> Notas de sesión
        </p>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Añade notas sobre esta sesión..."
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none transition"
        />
        <button onClick={handleGuardarNotas} disabled={saving || notas === (cita.notas ?? "")}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? "Guardando..." : "Guardar notas"}
        </button>
      </div>

      {/* Factura */}
      {cita.estadoPago === "pagado" && (
        <div className="mb-4">
          <button onClick={() => setFactura(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-200 text-violet-600 text-sm font-medium hover:bg-violet-50 transition-colors">
            <FileText className="w-4 h-4" /> Generar factura
          </button>
        </div>
      )}

      {/* Eliminar */}
      <div className="border-t border-slate-100 pt-4">
        {!confirm ? (
          <button onClick={() => setConfirm(true)}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" /> Eliminar cita
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600 font-medium">¿Eliminar esta cita?</p>
            <button onClick={handleEliminar} disabled={deleting}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1">
              {deleting && <Loader2 className="w-3 h-3 animate-spin" />} Sí, eliminar
            </button>
            <button onClick={() => setConfirm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </Modal>
    {factura && cita && <FacturaModal cita={cita} onClose={() => setFactura(false)} />}
    </>
  );
}
