"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { createClient } from "./supabase/client";

export type EstadoCita  = "confirmada" | "pendiente" | "cancelada" | "falta";
export type EstadoPago  = "pagado" | "pendiente" | "debe";

export interface Paciente {
  id:           string;
  nombre:       string;
  email:        string;
  telefono:     string;
  sesionPrecio: number;
  color?:       string;
  dni?:         string;
  direccion?:   string;
}

export interface Cita {
  id:          string;
  pacienteId:  string;
  fecha:       string;
  hora:        string;
  duracion:    number;
  estado:      EstadoCita;
  estadoPago:  EstadoPago;
  notas?:      string;
}

interface AppState {
  citas:       Cita[];
  pacientes:   Paciente[];
  loading:     boolean;
  addCita:       (c: Omit<Cita,  "id">) => Promise<void>;
  addPaciente:   (p: Omit<Paciente, "id">) => Promise<void>;
  updatePaciente:(id: string, changes: Partial<Omit<Paciente,"id">>) => Promise<void>;
  marcarPagado:  (citaId: string) => Promise<void>;
  marcarEstado:  (citaId: string, estado: EstadoCita) => Promise<void>;
  updateCita:    (citaId: string, changes: Partial<Omit<Cita,"id">>) => Promise<void>;
  deleteCita:    (citaId: string) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);
const COLORES = ["bg-violet-400","bg-sky-400","bg-emerald-400","bg-amber-400","bg-rose-400","bg-indigo-400","bg-teal-400","bg-pink-400"];

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [citas,     setCitas]     = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Cargar datos desde Supabase
  const cargar = useCallback(async () => {
    setLoading(true);
    const [{ data: pacs }, { data: cts }] = await Promise.all([
      supabase.from("pacientes").select("*").order("nombre"),
      supabase.from("citas").select("*").order("fecha").order("hora"),
    ]);
    setPacientes((pacs ?? []).map(p => ({
      id: p.id, nombre: p.nombre, email: p.email ?? "",
      telefono: p.telefono ?? "", sesionPrecio: p.sesion_precio, color: p.color,
      dni: p.dni ?? "", direccion: p.direccion ?? "",
    })));
    setCitas((cts ?? []).map(c => ({
      id: c.id, pacienteId: c.paciente_id, fecha: c.fecha,
      hora: c.hora.slice(0,5), duracion: c.duracion,
      estado: c.estado, estadoPago: c.estado_pago, notas: c.notas ?? "",
    })));
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function addPaciente(p: Omit<Paciente,"id">) {
    const color = COLORES[pacientes.length % COLORES.length];
    const { data } = await supabase.from("pacientes").insert({
      nombre: p.nombre, email: p.email, telefono: p.telefono,
      sesion_precio: p.sesionPrecio, color, dni: p.dni, direccion: p.direccion,
      user_id: userId,
    }).select().single();
    if (data) setPacientes(prev => [...prev, {
      id: data.id, nombre: data.nombre, email: data.email ?? "",
      telefono: data.telefono ?? "", sesionPrecio: data.sesion_precio,
      color: data.color, dni: data.dni ?? "", direccion: data.direccion ?? "",
    }]);
  }

  async function addCita(c: Omit<Cita,"id">) {
    const { data } = await supabase.from("citas").insert({
      paciente_id: c.pacienteId, fecha: c.fecha, hora: c.hora,
      duracion: c.duracion, estado: c.estado, estado_pago: c.estadoPago, notas: c.notas,
      user_id: userId,
    }).select().single();
    if (data) setCitas(prev => [...prev, { id: data.id, pacienteId: data.paciente_id, fecha: data.fecha, hora: data.hora.slice(0,5), duracion: data.duracion, estado: data.estado, estadoPago: data.estado_pago, notas: data.notas ?? "" }]);
  }

  async function updatePaciente(id: string, changes: Partial<Omit<Paciente,"id">>) {
    const dbChanges: Record<string, unknown> = {};
    if (changes.nombre      !== undefined) dbChanges.nombre       = changes.nombre;
    if (changes.email       !== undefined) dbChanges.email        = changes.email;
    if (changes.telefono    !== undefined) dbChanges.telefono     = changes.telefono;
    if (changes.sesionPrecio!== undefined) dbChanges.sesion_precio= changes.sesionPrecio;
    if (changes.dni         !== undefined) dbChanges.dni          = changes.dni;
    if (changes.direccion   !== undefined) dbChanges.direccion    = changes.direccion;
    await supabase.from("pacientes").update(dbChanges).eq("id", id);
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }

  async function marcarPagado(citaId: string) {
    await supabase.from("citas").update({ estado_pago: "pagado" }).eq("id", citaId);
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estadoPago: "pagado" } : c));
  }

  async function marcarEstado(citaId: string, estado: EstadoCita) {
    await supabase.from("citas").update({ estado }).eq("id", citaId);
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado } : c));
  }

  async function updateCita(citaId: string, changes: Partial<Omit<Cita,"id">>) {
    const dbChanges: Record<string, unknown> = {};
    if (changes.estado     !== undefined) dbChanges.estado      = changes.estado;
    if (changes.estadoPago !== undefined) dbChanges.estado_pago = changes.estadoPago;
    if (changes.notas      !== undefined) dbChanges.notas       = changes.notas;
    if (changes.hora       !== undefined) dbChanges.hora        = changes.hora;
    if (changes.fecha      !== undefined) dbChanges.fecha       = changes.fecha;
    if (changes.duracion   !== undefined) dbChanges.duracion    = changes.duracion;
    await supabase.from("citas").update(dbChanges).eq("id", citaId);
    setCitas(prev => prev.map(c => c.id === citaId ? { ...c, ...changes } : c));
  }

  async function deleteCita(citaId: string) {
    await supabase.from("citas").delete().eq("id", citaId);
    setCitas(prev => prev.filter(c => c.id !== citaId));
  }

  return (
    <Ctx.Provider value={{ citas, pacientes, loading, addCita, addPaciente, updatePaciente, marcarPagado, marcarEstado, updateCita, deleteCita }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
