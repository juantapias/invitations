-- ⚡ Invitaciones dinámicas — esquema inicial
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query → Run.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug             text not null unique
                   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  theme            text not null default 'pikachu',
  honoree          text not null check (char_length(honoree) between 1 and 40),
  age              int check (age between 0 and 120),
  phrase           text not null default '¡Te elijo a ti!' check (char_length(phrase) <= 60),
  message          text not null default '' check (char_length(message) <= 400),
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  timezone         text not null default 'America/Bogota',
  rsvp_deadline    timestamptz,
  time_note        text not null default '' check (char_length(time_note) <= 120),
  venue_name       text not null check (char_length(venue_name) between 1 and 120),
  venue_address    text not null default '' check (char_length(venue_address) <= 200),
  map_query        text not null default '' check (char_length(map_query) <= 200),
  lat              double precision check (lat between -90 and 90),
  lng              double precision check (lng between -180 and 180),
  dress_code       text not null default '' check (char_length(dress_code) <= 160),
  max_guests       int not null default 5 check (max_guests between 1 and 50),
  contact_whatsapp text not null default '' check (contact_whatsapp ~ '^[0-9]{0,15}$'),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint events_dates_check check (ends_at > starts_at)
);
create index events_owner_idx on public.events (owner_id);

-- Enlaces personalizados: /i/<slug>?c=<code>
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  code        text not null unique check (code ~ '^[a-z0-9]{6,16}$'),
  label       text not null check (char_length(label) between 1 and 80),
  max_guests  int not null default 5 check (max_guests between 1 and 50),
  created_at  timestamptz not null default now()
);
create index invites_event_idx on public.invites (event_id);

-- Confirmaciones. Una por dispositivo y evento: si el invitado cambia de opinión, se actualiza.
create table public.responses (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events (id) on delete cascade,
  invite_id   uuid references public.invites (id) on delete set null,
  device_id   text not null check (char_length(device_id) between 8 and 64),
  name        text not null check (char_length(name) between 1 and 80),
  attending   boolean not null,
  guests      int not null default 0 check (guests between 0 and 50),
  message     text not null default '' check (char_length(message) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint responses_device_unique unique (event_id, device_id),
  constraint responses_attending_guests_check check ((attending and guests >= 1) or (not attending and guests = 0))
);
create index responses_event_idx on public.responses (event_id);
create index responses_invite_idx on public.responses (invite_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger responses_updated_at before update on public.responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seguridad (RLS)
--   · Cada organizador solo ve y edita sus propios eventos, enlaces y respuestas.
--   · Los invitados NO acceden directo a la base de datos: la invitación pública y
--     el envío de confirmaciones pasan por el servidor de Next.js (clave secreta),
--     que valida cupos y fecha límite.
-- ---------------------------------------------------------------------------

alter table public.events    enable row level security;
alter table public.invites   enable row level security;
alter table public.responses enable row level security;

create function public.is_event_owner(eid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events e
    where e.id = eid and e.owner_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_event_owner(uuid) from public, anon;
grant execute on function public.is_event_owner(uuid) to authenticated;

create policy "events: dueño lee"      on public.events for select to authenticated using (owner_id = (select auth.uid()));
create policy "events: dueño crea"     on public.events for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "events: dueño edita"    on public.events for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "events: dueño elimina"  on public.events for delete to authenticated using (owner_id = (select auth.uid()));

create policy "invites: dueño lee"     on public.invites for select to authenticated using (public.is_event_owner(event_id));
create policy "invites: dueño crea"    on public.invites for insert to authenticated with check (public.is_event_owner(event_id));
create policy "invites: dueño edita"   on public.invites for update to authenticated using (public.is_event_owner(event_id)) with check (public.is_event_owner(event_id));
create policy "invites: dueño elimina" on public.invites for delete to authenticated using (public.is_event_owner(event_id));

create policy "responses: dueño lee"     on public.responses for select to authenticated using (public.is_event_owner(event_id));
create policy "responses: dueño elimina" on public.responses for delete to authenticated using (public.is_event_owner(event_id));

revoke all on public.events, public.invites, public.responses from anon;
grant select, insert, update, delete on public.events, public.invites to authenticated;
grant select, delete on public.responses to authenticated;
grant all on public.events, public.invites, public.responses to service_role;

-- ---------------------------------------------------------------------------
-- Tiempo real: el panel se actualiza solo cuando llega una confirmación
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.responses;
