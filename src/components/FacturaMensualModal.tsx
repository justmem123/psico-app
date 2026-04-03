"use client";
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import type { Paciente, Cita } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface Props {
  paciente: Paciente;
  citas: Cita[];
  periodo: string;    // "2026-T1"
  numero: number;
  onClose: () => void;
}

const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MESES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function fechaEmision(periodo: string) {
  const [y, t] = periodo.split("-");
  const lastDay: Record<string, string> = {
    T1: `${y}-03-31`, T2: `${y}-06-30`, T3: `${y}-09-30`, T4: `${y}-12-31`,
  };
  return lastDay[t] ?? new Date().toISOString().split("T")[0];
}

function periodoLabel(periodo: string) {
  const [y, t] = periodo.split("-");
  const labels: Record<string, string> = {
    T1: `1er Trimestre ${y} — Enero · Febrero · Marzo`,
    T2: `2º Trimestre ${y} — Abril · Mayo · Junio`,
    T3: `3er Trimestre ${y} — Julio · Agosto · Septiembre`,
    T4: `4º Trimestre ${y} — Octubre · Noviembre · Diciembre`,
  };
  return labels[t] ?? `${t} ${y}`;
}

function fmtFecha(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]} de ${d.getFullYear()}`;
}

function fmtFechaCorta(f: string) {
  const d = new Date(f + "T00:00:00");
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

function numFactura(periodo: string, numero: number) {
  const [year, t] = periodo.split("-");
  return `FAC${year}-${t}-${String(numero).padStart(3, "0")}`;
}

type Terapeuta = {
  nombre: string; email: string; telefono: string;
  cifNif: string; colegiado: string; direccionFacturacion: string;
};

function buildPrintHTML(
  terapeuta: Terapeuta,
  paciente: Paciente,
  citasOrdenadas: Cita[],
  numFac: string,
  fechaHoy: string,
  ultimaFecha: string,
  totalSesiones: number,
  totalImporte: number,
) {
  const filas = citasOrdenadas.map((c, i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9">
        <p style="margin:0;font-weight:600;color:#1e293b">Sesión de psicología ${i + 1}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#94a3b8">${c.hora}h${c.notas ? ` · ${c.notas}` : ""}</p>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px;color:#475569;white-space:nowrap">${fmtFechaCorta(c.fecha)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#1e293b">${paciente.sesionPrecio} €</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${numFac}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 48px; font-size: 14px; line-height: 1.5; }
    @page { margin: 1cm; size: A4; }
  </style>
</head>
<body>
  <!-- Cabecera -->
  <div style="margin-bottom:40px">
    <p style="font-size:28px;font-weight:700;color:#1e293b">FACTURA</p>
    <p style="font-size:13px;font-family:monospace;color:#64748b;margin-top:4px">${numFac}</p>
  </div>

  <!-- Emisor / Receptor -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px">
    <div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Emitida por</p>
      <p style="font-weight:600;color:#1e293b">${terapeuta.nombre}</p>
      ${terapeuta.cifNif ? `<p style="font-size:13px;color:#64748b;margin-top:4px">NIF/CIF: ${terapeuta.cifNif}</p>` : ""}
      ${terapeuta.colegiado ? `<p style="font-size:13px;color:#64748b">Nº colegiado: ${terapeuta.colegiado}</p>` : ""}
      ${terapeuta.direccionFacturacion ? `<p style="font-size:13px;color:#64748b">${terapeuta.direccionFacturacion}</p>` : ""}
      ${terapeuta.email ? `<p style="font-size:13px;color:#64748b">${terapeuta.email}</p>` : ""}
      ${terapeuta.telefono ? `<p style="font-size:13px;color:#64748b">${terapeuta.telefono}</p>` : ""}
    </div>
    <div>
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">Facturado a</p>
      <p style="font-weight:600;color:#1e293b">${paciente.nombre}</p>
      ${paciente.dni ? `<p style="font-size:13px;color:#64748b;margin-top:4px">DNI/NIE: ${paciente.dni}</p>` : ""}
      ${paciente.direccion ? `<p style="font-size:13px;color:#64748b">${paciente.direccion}</p>` : ""}
      ${paciente.email ? `<p style="font-size:13px;color:#64748b">${paciente.email}</p>` : ""}
      ${paciente.telefono ? `<p style="font-size:13px;color:#64748b">${paciente.telefono}</p>` : ""}
    </div>
  </div>

  <!-- Fechas -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:40px">
    <div style="background:#f8fafc;border-radius:10px;padding:14px">
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Fecha de emisión</p>
      <p style="font-size:13px;font-weight:500;color:#334155">${fechaHoy}</p>
    </div>
    <div style="background:#f8fafc;border-radius:10px;padding:14px">
      <p style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Última sesión</p>
      <p style="font-size:13px;font-weight:500;color:#334155">${ultimaFecha}</p>
    </div>
  </div>

  <!-- Tabla sesiones -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
    <thead>
      <tr style="border-bottom:2px solid #1e293b">
        <th style="text-align:left;padding-bottom:10px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Descripción</th>
        <th style="text-align:center;padding-bottom:10px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Fecha</th>
        <th style="text-align:right;padding-bottom:10px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Importe</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <!-- Total -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:0">
    <div style="width:260px">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#475569">
        <span>${totalSesiones} sesión${totalSesiones !== 1 ? "es" : ""} × ${paciente.sesionPrecio} €</span>
        <span>${totalImporte} €</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9">
        <span>IVA (0%)</span>
        <span>0,00 €</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:700;font-size:17px;color:#1e293b">
        <span>Total</span>
        <span style="color:#7c3aed">${totalImporte},00 €</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function FacturaMensualModal({ paciente, citas, periodo, numero, onClose }: Props) {
  const supabase = createClient();
  const [terapeuta, setTerapeuta] = useState<Terapeuta>({
    nombre: "", email: "", telefono: "", cifNif: "", colegiado: "", direccionFacturacion: "",
  });

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

  const numFac = numFactura(periodo, numero);
  const mesLabel = periodoLabel(periodo);
  const fechaHoy = fmtFecha(fechaEmision(periodo));
  const ultimaFecha = ultimaCita ? fmtFecha(ultimaCita.fecha) : "-";

  function imprimir() {
    const html = buildPrintHTML(terapeuta, paciente, citasOrdenadas, numFac, fechaHoy, ultimaFecha, totalSesiones, totalImporte);
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Factura trimestral — {mesLabel}</h2>
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

        {/* Vista previa */}
        <div className="p-8 md:p-10">
          <div className="mb-8">
            <p className="text-2xl font-bold text-slate-800">FACTURA</p>
            <p className="text-sm font-mono text-slate-500 mt-1">{numFac}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
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

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fecha de emisión</p>
              <p className="text-sm font-medium text-slate-700">{fechaHoy}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Última sesión</p>
              <p className="text-sm font-medium text-slate-700">{ultimaFecha}</p>
            </div>
          </div>

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

          <div className="flex justify-end">
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
        </div>
      </div>
    </div>
  );
}
