"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Cita, Paciente, EstadoPago, citas as citasIniciales, pacientes as pacientesIniciales } from "./mock-data";

interface AppState {
  citas:      Cita[];
  pacientes:  Paciente[];
  addCita:       (c: Omit<Cita, "id">) => void;
  addPaciente:   (p: Omit<Paciente, "id">) => void;
  marcarPagado:  (citaId: string) => void;
  marcarEstado:  (citaId: string, estado: Cita["estado"]) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [citas,     setCitas]     = useState<Cita[]>(citasIniciales);
  const [pacientes, setPacientes] = useState<Paciente[]>(pacientesIniciales);

  const COLORES = ["bg-violet-400","bg-sky-400","bg-emerald-400","bg-amber-400","bg-rose-400","bg-indigo-400","bg-teal-400","bg-pink-400"];

  function addCita(c: Omit<Cita, "id">) {
    setCitas(prev => [...prev, { ...c, id: `c${Date.now()}` }]);
  }

  function addPaciente(p: Omit<Paciente, "id">) {
    const color = COLORES[pacientes.length % COLORES.length];
    setPacientes(prev => [...prev, { ...p, id: `p${Date.now()}`, color }]);
  }

  function marcarPagado(citaId: string) {
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estadoPago: "pagado" as EstadoPago } : c));
  }

  function marcarEstado(citaId: string, estado: Cita["estado"]) {
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado } : c));
  }

  return (
    <Ctx.Provider value={{ citas, pacientes, addCita, addPaciente, marcarPagado, marcarEstado }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
