export type EstadoCita = "confirmada" | "pendiente" | "cancelada" | "falta";
export type EstadoPago = "pagado" | "pendiente" | "debe";

export interface Paciente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  sesionPrecio: number;
  color: string;
}

export interface Cita {
  id: string;
  pacienteId: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  duracion: number; // minutos
  estado: EstadoCita;
  estadoPago: EstadoPago;
  notas?: string;
}

export const pacientes: Paciente[] = [
  { id: "1", nombre: "Laura Martínez",   email: "laura@email.com",   telefono: "611 222 333", sesionPrecio: 60, color: "bg-violet-400" },
  { id: "2", nombre: "Carlos Sánchez",   email: "carlos@email.com",  telefono: "622 333 444", sesionPrecio: 60, color: "bg-sky-400"    },
  { id: "3", nombre: "Ana García",       email: "ana@email.com",     telefono: "633 444 555", sesionPrecio: 70, color: "bg-emerald-400"},
  { id: "4", nombre: "Miguel Torres",    email: "miguel@email.com",  telefono: "644 555 666", sesionPrecio: 60, color: "bg-amber-400"  },
  { id: "5", nombre: "Sofía Ruiz",       email: "sofia@email.com",   telefono: "655 666 777", sesionPrecio: 80, color: "bg-rose-400"   },
  { id: "6", nombre: "David López",      email: "david@email.com",   telefono: "666 777 888", sesionPrecio: 60, color: "bg-indigo-400" },
];

const hoy = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const citas: Cita[] = [
  // Hoy
  { id: "c1",  pacienteId: "1", fecha: fmt(hoy),         hora: "09:00", duracion: 50, estado: "confirmada", estadoPago: "pagado"   },
  { id: "c2",  pacienteId: "2", fecha: fmt(hoy),         hora: "10:00", duracion: 50, estado: "confirmada", estadoPago: "pendiente" },
  { id: "c3",  pacienteId: "3", fecha: fmt(hoy),         hora: "11:00", duracion: 50, estado: "pendiente",  estadoPago: "pendiente" },
  { id: "c4",  pacienteId: "4", fecha: fmt(hoy),         hora: "17:00", duracion: 50, estado: "confirmada", estadoPago: "pagado"   },
  { id: "c5",  pacienteId: "5", fecha: fmt(hoy),         hora: "18:00", duracion: 50, estado: "confirmada", estadoPago: "pendiente" },
  // Mañana
  { id: "c6",  pacienteId: "6", fecha: fmt(addDays(hoy,1)), hora: "09:00", duracion: 50, estado: "confirmada", estadoPago: "pendiente" },
  { id: "c7",  pacienteId: "1", fecha: fmt(addDays(hoy,1)), hora: "11:00", duracion: 50, estado: "confirmada", estadoPago: "pendiente" },
  { id: "c8",  pacienteId: "3", fecha: fmt(addDays(hoy,2)), hora: "10:00", duracion: 50, estado: "pendiente",  estadoPago: "pendiente" },
  { id: "c9",  pacienteId: "2", fecha: fmt(addDays(hoy,2)), hora: "12:00", duracion: 50, estado: "confirmada", estadoPago: "debe"     },
  { id: "c10", pacienteId: "4", fecha: fmt(addDays(hoy,3)), hora: "09:00", duracion: 50, estado: "cancelada",  estadoPago: "pendiente" },
  { id: "c11", pacienteId: "5", fecha: fmt(addDays(hoy,4)), hora: "18:00", duracion: 50, estado: "confirmada", estadoPago: "pendiente" },
  // Pasadas (esta semana)
  { id: "c12", pacienteId: "6", fecha: fmt(addDays(hoy,-1)), hora: "10:00", duracion: 50, estado: "confirmada", estadoPago: "debe"   },
  { id: "c13", pacienteId: "2", fecha: fmt(addDays(hoy,-2)), hora: "11:00", duracion: 50, estado: "falta",      estadoPago: "pendiente" },
];

export function getPaciente(id: string) {
  return pacientes.find(p => p.id === id)!;
}

export function getCitasHoy() {
  const hoyStr = fmt(new Date());
  return citas.filter(c => c.fecha === hoyStr).sort((a,b) => a.hora.localeCompare(b.hora));
}

export function getCitasPendientesPago() {
  return citas.filter(c => c.estadoPago === "pendiente" || c.estadoPago === "debe");
}

export function getIngresosMes() {
  const mes = new Date().getMonth();
  return citas
    .filter(c => {
      const d = new Date(c.fecha);
      return d.getMonth() === mes && c.estadoPago === "pagado";
    })
    .reduce((sum, c) => sum + getPaciente(c.pacienteId).sesionPrecio, 0);
}
