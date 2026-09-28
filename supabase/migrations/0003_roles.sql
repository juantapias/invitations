-- ⚡ Roles: el administrador de la plataforma (tú) crea y edita eventos;
--    el cliente solo gestiona los invitados de sus eventos.
-- Ejecuta este archivo en Supabase → SQL Editor después de 0002.
-- Al final hay una línea para registrarte como administrador: cambia el correo.

-- ---------------------------------------------------------------------------
-- Administradores de la plataforma
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
-- Cada usuario puede saber si él mismo es administrador (nada más)
create policy "platform_admins: ver el propio" on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.platform_admins from anon;
grant select on public.platform_admins to authenticated;
grant all on public.platform_admins to service_role;

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- El dueño de un evento (cliente) o un administrador
create or replace function public.is_event_owner(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = eid and (e.owner_id = (select auth.uid()) or public.is_platform_admin())
  );
$$;

-- ---------------------------------------------------------------------------
-- Eventos: el cliente solo los ve; crear/editar/eliminar es del administrador
-- ---------------------------------------------------------------------------

drop policy "events: dueño lee" on public.events;
drop policy "events: dueño crea" on public.events;
drop policy "events: dueño edita" on public.events;
drop policy "events: dueño elimina" on public.events;

create policy "events: cliente o admin leen" on public.events for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_platform_admin());
create policy "events: admin crea" on public.events for insert to authenticated
  with check (public.is_platform_admin());
create policy "events: admin edita" on public.events for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "events: admin elimina" on public.events for delete to authenticated
  using (public.is_platform_admin());

-- Datos del cliente para mostrarlos en el panel (la cuenta real es owner_id)
alter table public.events
  add column client_name  text not null default '' check (char_length(client_name) <= 80),
  add column client_email text not null default '' check (char_length(client_email) <= 254);

-- Enlaces y respuestas ya usan is_event_owner(): el cliente gestiona los suyos y el admin todos.

-- ---------------------------------------------------------------------------
-- Rutas reservadas (se agrega /mis-eventos)
-- ---------------------------------------------------------------------------

alter table public.events drop constraint events_slug_not_reserved;
alter table public.events add constraint events_slug_not_reserved check (
  slug not in (
    'admin', 'api', 'app', 'assets', 'auth', 'dashboard', 'evento', 'favicon', 'i', 'login', 'logout',
    'mis-eventos', 'panel', 'public', 'registro', 'robots', 'signup', 'sitemap', 'static', 'themes', 'www'
  )
);

-- ---------------------------------------------------------------------------
-- Buscar una cuenta por correo (solo el servidor, con la clave secreta)
-- ---------------------------------------------------------------------------

create function public.get_user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- 👉 Regístrate como administrador (cambia el correo por el tuyo y ejecuta).
--    Tu usuario debe existir antes en Authentication → Users.
-- ---------------------------------------------------------------------------
-- insert into public.platform_admins (user_id)
-- select id from auth.users where email = 'tu-correo@ejemplo.com';
