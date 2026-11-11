-- Sincronización con Google Calendar (ejecutar una vez en el SQL Editor de Supabase)

-- 1) Marca de qué evento de Google viene cada cita
alter table public.citas add column if not exists google_uid text;
create unique index if not exists citas_user_google_uid on public.citas (user_id, google_uid);

-- 2) Dirección iCal secreta de cada psicólogo
create table if not exists public.google_sync (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ical_url    text not null,
  ultima_sync timestamptz
);

-- 3) Títulos de Google asignados a mano a un paciente (paciente_id null = ignorar)
create table if not exists public.google_alias (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo      text not null,
  paciente_id uuid references public.pacientes(id) on delete cascade,
  primary key (user_id, titulo)
);

alter table public.google_sync  enable row level security;
alter table public.google_alias enable row level security;

create policy "google_sync_propio"  on public.google_sync  for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "google_alias_propio" on public.google_alias for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
