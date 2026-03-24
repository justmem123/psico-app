"use client";
import { useState } from "react";

const PAISES = [
  { code: "+34", flag: "🇪🇸", name: "España" },
  { code: "+33", flag: "🇫🇷", name: "Francia" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+49", flag: "🇩🇪", name: "Alemania" },
  { code: "+39", flag: "🇮🇹", name: "Italia" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+212", flag: "🇲🇦", name: "Marruecos" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+1",  flag: "🇺🇸", name: "EEUU" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function PhoneInput({ value, onChange, required, className = "" }: Props) {
  // Detect prefix from value
  const detectPrefix = (v: string) => PAISES.find(p => v.startsWith(p.code)) ?? PAISES[0];
  const [pais, setPais] = useState(() => detectPrefix(value));
  const numero = value.startsWith(pais.code) ? value.slice(pais.code.length).trimStart() : value;

  function handlePais(code: string) {
    const nuevo = PAISES.find(p => p.code === code) ?? PAISES[0];
    setPais(nuevo);
    onChange(numero ? `${nuevo.code} ${numero}` : "");
  }

  function handleNumero(num: string) {
    onChange(num ? `${pais.code} ${num}` : "");
  }

  return (
    <div className={`flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-400 transition ${className}`}>
      <select
        value={pais.code}
        onChange={e => handlePais(e.target.value)}
        className="bg-transparent text-sm pl-2 pr-1 py-2.5 border-r border-slate-200 text-slate-700 focus:outline-none cursor-pointer"
      >
        {PAISES.map(p => (
          <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
        ))}
      </select>
      <input
        type="tel"
        required={required}
        value={numero}
        onChange={e => handleNumero(e.target.value)}
        placeholder="600 000 000"
        className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
      />
    </div>
  );
}
