// Fechas siempre en la zona horaria del evento, no en la del navegador.

export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Bogota', label: 'Colombia (Bogotá)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
  { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil)' },
  { value: 'America/Mexico_City', label: 'México (CDMX)' },
  { value: 'America/Panama', label: 'Panamá' },
  { value: 'America/Caracas', label: 'Venezuela (Caracas)' },
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (Buenos Aires)' },
  { value: 'America/Santo_Domingo', label: 'República Dominicana' },
  { value: 'America/New_York', label: 'EE. UU. (Nueva York / Miami)' },
  { value: 'Europe/Madrid', label: 'España (Madrid)' },
];

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(utcMs: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - utcMs;
}

// '2026-10-25' + '14:00' en 'America/Bogota' → '2026-10-25T19:00:00.000Z'
export function zonedToUtcIso(date: string, time: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  let utc = guess - tzOffsetMs(guess, tz);
  utc = guess - tzOffsetMs(utc, tz); // segunda pasada por cambios de horario
  return new Date(utc).toISOString();
}

// ISO → { date: 'YYYY-MM-DD', time: 'HH:MM' } en la zona del evento (para los formularios)
export function utcToZoned(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatLongDate(iso: string, tz: string) {
  return cap(new Intl.DateTimeFormat('es-CO', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso)));
}

export function formatShortDate(iso: string, tz: string) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: tz, day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function formatTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(iso))
    .replace(/\s/g, ' ')
    .replace(/p\. ?m\./, 'p.m.')
    .replace(/a\. ?m\./, 'a.m.');
}

export function formatDateTimeShort(iso: string, tz: string) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}
