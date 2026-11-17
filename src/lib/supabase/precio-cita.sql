-- Precio propio de una cita (17-11-2026).
-- NULL = se usa el precio de la ficha del paciente (pacientes.sesion_precio).
-- Solo añade una columna vacía: no cambia ni borra ningún dato existente.
alter table public.citas add column if not exists precio numeric(8,2) check (precio is null or precio >= 0);
