export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const CODE_RE = /^[a-z0-9]{6,16}$/;

// Rutas del sistema que un evento no puede usar como enlace (/panel, /login, …)
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'assets', 'auth', 'dashboard', 'evento', 'favicon', 'i', 'login', 'logout',
  'mis-eventos', 'panel', 'public', 'registro', 'robots', 'signup', 'sitemap', 'static', 'themes', 'www',
]);

export const isValidEventSlug = (slug: string) =>
  slug.length >= 3 && slug.length <= 60 && SLUG_RE.test(slug) && !RESERVED_SLUGS.has(slug);

// Convierte cualquier texto en formato de enlace: "Benjamín 6 ¡Años!" → "benjamin-6-anos".
// Con keepTrailingDash (mientras se escribe) deja el guion final para poder seguir tecleando.
export function toSlug(value: string, { keepTrailingDash = false, max = 60 } = {}) {
  let s = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes (ñ → n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // espacios y símbolos → guion
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, max);
  if (!keepTrailingDash) s = s.replace(/-+$/, '');
  return s;
}
