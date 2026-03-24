-- Tabla pacientes
create table public.pacientes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text,
  telefono      text,
  sesion_precio integer not null default 60,
  color         text not null default 'bg-violet-400',
  created_at    timestamptz default now()
);

-- Tabla citas
create table public.citas (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid references public.pacientes(id) on delete cascade,
  fecha        date not null,
  hora         time not null,
  duracion     integer not null default 50,
  estado       text not null default 'pendiente'
                 check (estado in ('confirmada','pendiente','cancelada','falta')),
  estado_pago  text not null default 'pendiente'
                 check (estado_pago in ('pagado','pendiente','debe')),
  notas        text,
  created_at   timestamptz default now()
);

-- Habilitar Row Level Security (seguridad)
alter table public.pacientes enable row level security;
alter table public.citas      enable row level security;

-- Políticas: por ahora acceso público (lo aseguramos con auth después)
create policy "acceso_publico_pacientes" on public.pacientes for all using (true);
create policy "acceso_publico_citas"     on public.citas     for all using (true);
