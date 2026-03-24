"use client";
import { useEffect, useState } from "react";
import { Printer, X, Brain } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Cita } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface Props {
  cita: Cita;
  onClose: () => void;
}

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fmtFecha(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function numFactura(citaId: string) {
  const n = parseInt(citaId.replace(/\D/g, "").slice(0,6) || "1", 10);
  return `FAC-${new Date().getFullYear()}-${String(n % 9999 + 1).padStart(4,"0")}`;
}

export default function FacturaModal({ cita, onClose }: Props) {
  const { pacientes } = useApp();
  const supabase = createClient();
  const pac = pacientes.find(p => p.id === cita.pacienteId);
  const [terapeuta, setTerapeuta] = useState({ nombre: "", email: "", telefono: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const m = data.user.user_metadata ?? {};
        setTerapeuta({
          nombre:   `${m.nombre ?? ""} ${m.apellidos ?? ""}`.trim() || "Psicólogo/a",
          email:    data.user.email ?? "",
          telefono: m.telefono ?? "",
        });
      }
    });
  }, []);

  if (!pac) return null;

  const numFac   = numFactura(cita.id);
  const fechaHoy = fmtFecha(new Date().toISOString().split("T")[0]);
  const fechaCita = fmtFecha(cita.fecha);

  function imprimir() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
          <h2 className="font-semibold text-slate-800">Vista previa de factura</h2>
          <div className="flex items-center gap-2">
            <button onClick={imprimir}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Factura */}
        <div id="factura-print" className="p-8 md:p-10">
          {/* Cabecera */}
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg leading-tight">PsicoGestión</p>
                <p className="text-xs text-slate-400">Consulta de psicología</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-600">FACTURA</p>
              <p className="text-sm font-mono text-slate-500 mt-1">{numFac}</p>
            </div>
          </div>

          {/* Datos emisor / receptor */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Emitida por</p>
              <p className="font-semibold text-slate-800">{terapeuta.nombre || "Psicólogo/a"}</p>
              {terapeuta.email    && <p className="text-sm text-slate-500 mt-1">{terapeuta.email}</p>}
              {terapeuta.telefono && <p className="text-sm text-slate-500">{terapeuta.telefono}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Facturado a</p>
              <p className="font-semibold text-slate-800">{pac.nombre}</p>
              {pac.dni      && <p className="text-sm text-slate-500 mt-1">DNI/NIE: {pac.dni}</p>}
              {pac.direccion && <p className="text-sm text-slate-500">{pac.direccion}</p>}
              {pac.email    && <p className="text-sm text-slate-500">{pac.email}</p>}
              {pac.telefono && <p className="text-sm text-slate-500">{pac.telefono}</p>}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fecha de emisión</p>
              <p className="text-sm font-medium text-slate-700">{fechaHoy}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fecha de sesión</p>
              <p className="text-sm font-medium text-slate-700">{fechaCita}</p>
            </div>
          </div>

          {/* Tabla de servicios */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                <th className="text-center pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Duración</th>
                <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <p className="font-medium text-slate-800">Sesión de psicología</p>
                  <p className="text-sm text-slate-500 mt-0.5">{fechaCita} · {cita.hora}h{cita.notas ? ` · ${cita.notas}` : ""}</p>
                </td>
                <td className="py-4 text-center text-sm text-slate-600">{cita.duracion} min</td>
                <td className="py-4 text-right font-semibold text-slate-800">{pac.sesionPrecio} €</td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-10">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{pac.sesionPrecio} €</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-100">
                <span>IVA (0%)</span>
                <span>0,00 €</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-slate-800 text-lg">
                <span>Total</span>
                <span className="text-violet-600">{pac.sesionPrecio},00 €</span>
              </div>
            </div>
          </div>

          {/* Estado de pago */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3 mb-8">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">Pago recibido — Gracias</p>
          </div>

          {/* Pie */}
          <div className="border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-slate-400">
              Documento emitido por PsicoGestión · {terapeuta.email} · {fechaHoy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
