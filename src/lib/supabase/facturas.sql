-- Números de factura fijos (17-11-2026). Cada factura (trimestral de paciente o mensual de profesional)
-- se guarda con su número la primera vez que se imprime y ya no cambia.
create table if not exists public.facturas (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  clave       text not null,          -- "<paciente_id>|2026-T1" o "<paciente_id>|2026-10"
  numero      integer not null,       -- 98 → FAC2026-T4-098
  periodo     text not null,          -- trimestre de la factura: "2026-T4"
  paciente_id uuid references public.pacientes(id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, clave),
  unique (user_id, numero)
);
alter table public.facturas enable row level security;
create policy "facturas_leer"  on public.facturas for select using (auth.uid() = user_id);
create policy "facturas_crear" on public.facturas for insert with check (auth.uid() = user_id);
