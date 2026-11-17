-- Profesionales que derivan pacientes (p. ej. Paula) — 17-11-2026.
-- Solo añade columnas; no cambia ni borra datos.
alter table public.pacientes add column if not exists profesional boolean not null default false;
alter table public.pacientes add column if not exists retencion numeric(5,2) not null default 0 check (retencion >= 0 and retencion <= 100);
alter table public.pacientes add column if not exists concepto_factura text;
