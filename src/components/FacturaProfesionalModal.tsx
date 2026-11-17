"use client";
// Factura mensual a una profesional que deriva pacientes (p. ej. Paula):
// un solo concepto («Honorarios … en el mes de …»), nº de sesiones × precio, retención de IRPF y total.
import { useEffect, useState } from "react";
import { Printer, X } from "lucide-react";
import type { Paciente, Cita } from "@/lib/store";
import { precioCita, fmtImporte } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface Props {
  paciente: Paciente;
  citas: Cita[];
  mes: string;        // "2026-10"
  numero: string;     // "FAC2026-T4-098"
  onClose: () => void;
  onImprimir?: () => void;   // guarda el número de la factura la primera vez
}

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Terapeuta = {
  nombre: string; email: string; telefono: string;
  cifNif: string; colegiado: string; direccionFacturacion: string; iban: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function datosFacturaProfesional(paciente: Paciente, citas: Cita[], mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const n = citas.length;
  const base = citas.reduce((s, c) => s + precioCita(c, paciente), 0);
  const precioUnico = citas.every(c => precioCita(c, paciente) === paciente.sesionPrecio);
  const pct = paciente.retencion ?? 0;
  const retencion = Math.round(base * pct) / 100;
  const ultimoDia = new Date(y, m, 0).getDate();
  return {
    n, base, pct, retencion, total: Math.round((base - retencion) * 100) / 100,
    cantidad: `${n} sesi${n === 1 ? "ón" : "ones"}${precioUnico ? ` × ${fmtImporte(paciente.sesionPrecio)} €` : ""}`,
    concepto: `${paciente.conceptoFactura || "Honorarios por prestación de servicios como Psicóloga General Sanitaria"} en el mes de ${mayus(MESES[m - 1])} ${y}`,
    fecha: `${ultimoDia} de ${MESES[m - 1]} de ${y}`,
  };
}

function buildPrintHTML(t: Terapeuta, p: Paciente, numFac: string, d: ReturnType<typeof datosFacturaProfesional>) {
  const linea = (izq: string, der: string, extra = "") =>
    `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:11px;color:#475569;${extra}"><span>${izq}</span><span>${der}</span></div>`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${numFac}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 28px 36px; font-size: 11px; line-height: 1.4; }
    @page { margin: 0.8cm; size: A4; }
    .k { font-size:9px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px }
    .s { font-size:10px;color:#64748b }
  </style>
</head>
<body>
  <div style="margin-bottom:20px">
    <p style="font-size:22px;font-weight:700">FACTURA</p>
    <p style="font-size:11px;font-family:monospace;color:#64748b;margin-top:3px">${numFac}</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px">
    <div>
      <p class="k">Emitida por</p>
      <p style="font-weight:600;font-size:11px">${esc(t.nombre)}</p>
      ${t.cifNif ? `<p class="s" style="margin-top:2px">NIF/CIF: ${esc(t.cifNif)}</p>` : ""}
      ${t.colegiado ? `<p class="s">Nº colegiado: ${esc(t.colegiado)}</p>` : ""}
      ${t.direccionFacturacion ? `<p class="s">${esc(t.direccionFacturacion)}</p>` : ""}
      ${t.email ? `<p class="s">${esc(t.email)}</p>` : ""}
      ${t.telefono ? `<p class="s">${esc(t.telefono)}</p>` : ""}
      ${t.iban ? `<p class="s">Número de cuenta: ${esc(t.iban)}</p>` : ""}
    </div>
    <div>
      <p class="k">Facturado a</p>
      <p style="font-weight:600;font-size:11px">${esc(p.nombre)}</p>
      ${p.dni ? `<p class="s" style="margin-top:2px">DNI/NIE: ${esc(p.dni)}</p>` : ""}
      ${p.direccion ? `<p class="s">${esc(p.direccion)}</p>` : ""}
      ${p.email ? `<p class="s">${esc(p.email)}</p>` : ""}
      ${p.telefono ? `<p class="s">${esc(p.telefono)}</p>` : ""}
    </div>
  </div>
  <div style="background:#f8fafc;border-radius:8px;padding:8px 10px;margin-bottom:16px;width:50%">
    <p class="k" style="margin-bottom:2px">Fecha de emisión</p>
    <p style="font-size:11px;font-weight:500;color:#334155">${d.fecha}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead>
      <tr style="border-bottom:2px solid #1e293b">
        <th style="text-align:left;padding-bottom:6px" class="k">Descripción</th>
        <th style="text-align:right;padding-bottom:6px;white-space:nowrap" class="k">Cantidad</th>
        <th style="text-align:right;padding-bottom:6px" class="k">Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:8px 12px 8px 0;border-bottom:1px solid #f1f5f9;font-size:11px">${esc(d.concepto)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;font-size:11px;color:#475569">${d.cantidad}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;font-size:11px">${fmtImporte(d.base)} €</td>
      </tr>
    </tbody>
  </table>
  <div style="display:flex;justify-content:flex-end">
    <div style="width:240px">
      ${linea("Base imponible", `${fmtImporte(d.base)} €`)}
      ${linea("IVA (0 %, exento)", "0,00 €")}
      ${d.pct ? linea(`Retención IRPF (${String(d.pct).replace(".", ",")} %)`, `−${fmtImporte(d.retencion)} €`, "border-bottom:1px solid #f1f5f9") : ""}
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:700;font-size:14px">
        <span>Total a pagar</span><span style="color:#7c3aed">${fmtImporte(d.total)} €</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function FacturaProfesionalModal({ paciente, citas, mes, numero, onClose, onImprimir }: Props) {
  const [t, setT] = useState<Terapeuta>({ nombre: "", email: "", telefono: "", cifNif: "", colegiado: "", direccionFacturacion: "", iban: "" });

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const m = data.user.user_metadata ?? {};
      setT({
        nombre: `${m.nombre ?? ""} ${m.apellidos ?? ""}`.trim() || "Psicólogo/a",
        email: data.user.email ?? "", telefono: m.telefono ?? "", cifNif: m.cifNif ?? "",
        colegiado: m.colegiado ?? "", direccionFacturacion: m.direccionFacturacion ?? "", iban: m.iban ?? "",
      });
    });
  }, []);

  const d = datosFacturaProfesional(paciente, citas, mes);

  function imprimir() {
    onImprimir?.();
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(buildPrintHTML(t, paciente, numero, d));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const fila = (izq: string, der: string, cls = "") => (
    <div className={`flex justify-between py-2 text-sm text-slate-600 ${cls}`}><span>{izq}</span><span>{der}</span></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 truncate">Factura mensual — {d.fecha.split(" de ").slice(1).join(" de ")}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={imprimir}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" aria-label="Cerrar">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-5 md:p-10">
          <div className="mb-6">
            <p className="text-2xl font-bold text-slate-800">FACTURA</p>
            <p className="text-sm font-mono text-slate-500 mt-1">{numero}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Emitida por</p>
              <p className="font-semibold text-slate-800">{t.nombre}</p>
              {t.cifNif && <p className="text-sm text-slate-500 mt-1">NIF/CIF: {t.cifNif}</p>}
              {t.colegiado && <p className="text-sm text-slate-500">Nº colegiado: {t.colegiado}</p>}
              {t.direccionFacturacion && <p className="text-sm text-slate-500">{t.direccionFacturacion}</p>}
              {t.email && <p className="text-sm text-slate-500">{t.email}</p>}
              {t.telefono && <p className="text-sm text-slate-500">{t.telefono}</p>}
              {t.iban
                ? <p className="text-sm text-slate-500">Número de cuenta: {t.iban}</p>
                : <p className="text-xs text-amber-600 mt-1">Falta el número de cuenta: ponlo en Ajustes.</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Facturado a</p>
              <p className="font-semibold text-slate-800">{paciente.nombre}</p>
              {paciente.dni && <p className="text-sm text-slate-500 mt-1">DNI/NIE: {paciente.dni}</p>}
              {paciente.direccion && <p className="text-sm text-slate-500">{paciente.direccion}</p>}
              {paciente.email && <p className="text-sm text-slate-500">{paciente.email}</p>}
              {paciente.telefono && <p className="text-sm text-slate-500">{paciente.telefono}</p>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 sm:w-1/2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fecha de emisión</p>
            <p className="text-sm font-medium text-slate-700">{d.fecha}</p>
          </div>

          <div className="border-b-2 border-slate-800 pb-2 mb-2 flex text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <span className="flex-1">Descripción</span><span>Importe</span>
          </div>
          <div className="flex gap-4 py-3 border-b border-slate-100 mb-4">
            <div className="flex-1">
              <p className="text-sm text-slate-800">{d.concepto}</p>
              <p className="text-xs text-slate-400 mt-0.5">{d.cantidad}</p>
            </div>
            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{fmtImporte(d.base)} €</p>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-72">
              {fila("Base imponible", `${fmtImporte(d.base)} €`)}
              {fila("IVA (0 %, exento)", "0,00 €")}
              {d.pct > 0 && fila(`Retención IRPF (${String(d.pct).replace(".", ",")} %)`, `−${fmtImporte(d.retencion)} €`, "border-b border-slate-100")}
              <div className="flex justify-between py-3 font-bold text-lg text-slate-800">
                <span>Total a pagar</span><span className="text-violet-600">{fmtImporte(d.total)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
