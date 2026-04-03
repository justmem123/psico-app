"use client";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import type { Paciente, Cita } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface Props {
  paciente: Paciente;
  citas: Cita[];      // ya filtradas: mismo paciente, mismo mes, pagadas
  mes: string;        // "2026-01"
  numero: number;     // número secuencial de la factura
  onClose: () => void;
}

const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fmtFecha(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`;
}

function fmtFechaCorta(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

function numFactura(mes: string, numero: number) {
  const [year] = mes.split("-");
  return `FAC${year}-${String(numero).padStart(3, "0")}`;
}

export default function FacturaMensualModal({ paciente, citas, mes, numero, onClose }: Props) {
  const supabase = createClient();
  const [terapeuta, setTerapeuta] = useState({ nombre: "", email: "", telefono: "", cifNif: "", colegiado: "", direccionFacturacion: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const m = data.user.user_metadata ?? {};
        setTerapeuta({
          nombre:               `${m.nombre ?? ""} ${m.apellidos ?? ""}`.trim() || "Psicólogo/a",
          email:                data.user.email ?? "",
          telefono:             m.telefono ?? "",
          cifNif:               m.cifNif ?? "",
          colegiado:            m.colegiado ?? "",
          direccionFacturacion: m.direccionFacturacion ?? "",
        });
      }
    });
  }, []);

  const citasOrdenadas = [...citas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimaCita = citasOrdenadas[citasOrdenadas.length - 1];
  const totalSesiones = citas.length;
  const totalImporte = totalSesiones * paciente.sesionPrecio;

  const [year, month] = mes.split("-");
  const mesLabel = `${MESES_LARGO[parseInt(month) - 1]} ${year}`;
  const numFac = numFactura(mes, numero);
  const fechaHoy = fmtFecha(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden">
          <h2 className="font-semibold text-slate-800">Factura mensual — {mesLabel}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
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
            <div>
              <p className="text-2xl font-bold text-slate-800">FACTURA</p>
              <p className="text-sm font-mono text-slate-500 mt-1">{numFac}</p>
            </div>
          </div>

          {/* Datos emisor / receptor */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Emitida por</p>
              <p className="font-semibold text-slate-800">{terapeuta.nombre}</p>
              {terapeuta.cifNif              && <p className="text-sm text-slate-500 mt-1">NIF/CIF: {terapeuta.cifNif}</p>}
              {terapeuta.colegiado           && <p className="text-sm text-slate-500">Nº colegiado: {terapeuta.colegiado}</p>}
              {terapeuta.direccionFacturacion && <p className="text-sm text-slate-500">{terapeuta.direccionFacturacion}</p>}
              {terapeuta.email               && <p className="text-sm text-slate-500">{terapeuta.email}</p>}
              {terapeuta.telefono            && <p className="text-sm text-slate-500">{terapeuta.telefono}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Facturado a</p>
              <p className="font-semibold text-slate-800">{paciente.nombre}</p>
              {paciente.dni       && <p className="text-sm text-slate-500 mt-1">DNI/NIE: {paciente.dni}</p>}
              {paciente.direccion && <p className="text-sm text-slate-500">{paciente.direccion}</p>}
              {paciente.email     && <p className="text-sm text-slate-500">{paciente.email}</p>}
              {paciente.telefono  && <p className="text-sm text-slate-500">{paciente.telefono}</p>}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fecha de emisión</p>
              <p className="text-sm font-medium text-slate-700">{fechaHoy}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Última sesión</p>
              <p className="text-sm font-medium text-slate-700">{ultimaCita ? fmtFecha(ultimaCita.fecha) : "-"}</p>
            </div>
          </div>

          {/* Tabla de sesiones */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                <th className="text-center pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe</th>
              </tr>
            </thead>
            <tbody>
              {citasOrdenadas.map((cita, i) => (
                <tr key={cita.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <p className="font-medium text-slate-800">Sesión de psicología {i + 1}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cita.hora}h{cita.notas ? ` · ${cita.notas}` : ""}</p>
                  </td>
                  <td className="py-3 text-center text-sm text-slate-600 whitespace-nowrap">{fmtFechaCorta(cita.fecha)}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">{paciente.sesionPrecio} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end mb-10">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm text-slate-600">
                <span>{totalSesiones} sesión{totalSesiones !== 1 ? "es" : ""} × {paciente.sesionPrecio} €</span>
                <span>{totalImporte} €</span>
              </div>
              <div className="flex justify-between py-2 text-sm text-slate-600 border-b border-slate-100">
                <span>IVA (0%)</span>
                <span>0,00 €</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-slate-800 text-lg">
                <span>Total</span>
                <span className="text-violet-600">{totalImporte},00 €</span>
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
