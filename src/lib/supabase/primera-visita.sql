-- Formulario de primera visita (ejecutar una vez en el SQL Editor de Supabase)
-- El paciente NO inicia sesión: entra con un enlace de un solo uso que caduca a los 7 días.
-- Solo puede hacer dos cosas, a través de funciones SECURITY DEFINER:
--   1) comprobar si su enlace vale (invitacion_info)
--   2) enviar SUS datos una sola vez (invitacion_enviar)
-- No puede leer ningún dato de pacientes ni de citas.

-- 1) Campos nuevos en pacientes
alter table public.pacientes add column if not exists fecha_nacimiento        date;
alter table public.pacientes add column if not exists motivo_consulta         text;
alter table public.pacientes add column if not exists primera_terapia         boolean;
alter table public.pacientes add column if not exists como_conocio            text;
alter table public.pacientes add column if not exists consentimiento_at       timestamptz;
alter table public.pacientes add column if not exists consentimiento_version  text;
alter table public.pacientes add column if not exists nuevo                   boolean not null default false;

-- 2) Invitaciones (enlaces de un solo uso)
create table if not exists public.invitaciones (
  token        text primary key default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre_hint  text,
  creada       timestamptz not null default now(),
  caduca       timestamptz not null default now() + interval '7 days',
  usada_at     timestamptz,
  paciente_id  uuid references public.pacientes(id) on delete set null
);
alter table public.invitaciones enable row level security;
drop policy if exists "invitaciones_propias" on public.invitaciones;
create policy "invitaciones_propias" on public.invitaciones for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) ¿Vale este enlace?  → 'ok' | 'usada' | 'caducada' | 'no_existe'
create or replace function public.invitacion_info(p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from invitaciones where token = p_token;
  if not found then return 'no_existe'; end if;
  if inv.usada_at is not null then return 'usada'; end if;
  if inv.caduca < now() then return 'caducada'; end if;
  return 'ok';
end $$;

-- 4) Enviar el formulario (una sola vez) → crea el paciente en la cuenta de quien invitó
create or replace function public.invitacion_enviar(p_token text, d jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare inv record; nuevo_id uuid; precio integer; n text;
begin
  select * into inv from invitaciones where token = p_token for update;
  if not found then return 'no_existe'; end if;
  if inv.usada_at is not null then return 'usada'; end if;
  if inv.caduca < now() then return 'caducada'; end if;

  n := trim(coalesce(d->>'nombre', '')) || ' ' || trim(coalesce(d->>'apellidos', ''));
  if length(trim(n)) < 3 or length(coalesce(d->>'telefono', '')) < 6 then return 'faltan_datos'; end if;
  if coalesce((d->>'acepta_terapia')::boolean, false) is not true
     or coalesce((d->>'acepta_datos')::boolean, false) is not true then return 'sin_consentimiento'; end if;

  -- Precio: el más habitual entre sus pacientes (si no hay, 50 €)
  select sesion_precio into precio from pacientes where user_id = inv.user_id
    group by sesion_precio order by count(*) desc limit 1;

  insert into pacientes (user_id, nombre, telefono, email, dni, direccion, sesion_precio, color,
                         fecha_nacimiento, motivo_consulta, primera_terapia, como_conocio,
                         consentimiento_at, consentimiento_version, nuevo)
  values (inv.user_id, left(trim(n), 120), left(d->>'telefono', 30), nullif(left(d->>'email', 120), ''),
          nullif(upper(left(d->>'dni', 20)), ''), nullif(left(d->>'direccion', 200), ''),
          coalesce(precio, 50), 'bg-teal-400',
          nullif(d->>'fecha_nacimiento', '')::date, nullif(left(d->>'motivo', 1000), ''),
          (d->>'primera_terapia')::boolean, nullif(left(d->>'como_conocio', 120), ''),
          now(), left(coalesce(d->>'version', ''), 40), true)
  returning id into nuevo_id;

  update invitaciones set usada_at = now(), paciente_id = nuevo_id where token = p_token;
  return 'ok';
end $$;

revoke all on function public.invitacion_info(text)         from public;
revoke all on function public.invitacion_enviar(text, jsonb) from public;
grant execute on function public.invitacion_info(text)         to anon, authenticated;
grant execute on function public.invitacion_enviar(text, jsonb) to anon, authenticated;
