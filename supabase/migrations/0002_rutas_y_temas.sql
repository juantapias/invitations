-- ⚡ Enlaces en la raíz del dominio (/benjamin, /benjamin/admin) y temas por invitación.
-- Ejecuta este archivo en Supabase → SQL Editor después de 0001_init.sql.

-- Un evento no puede usar como enlace una ruta del sistema (mantener igual a RESERVED_SLUGS en src/lib/slug.ts)
alter table public.events add constraint events_slug_not_reserved check (
  slug not in (
    'admin', 'api', 'app', 'assets', 'auth', 'dashboard', 'evento', 'favicon', 'i', 'login', 'logout',
    'panel', 'public', 'registro', 'robots', 'signup', 'sitemap', 'static', 'themes', 'www'
  )
);

-- El tema se elige en el panel; el valor por defecto sigue siendo 'pikachu'
comment on column public.events.theme is 'Id del tema en src/themes/registry.ts (pikachu, galaxia, …)';
