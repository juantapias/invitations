import type { PublicEvent } from './types';

type CalEvent = Pick<PublicEvent, 'honoree' | 'age' | 'phrase' | 'time_note' | 'dress_code' | 'venue_name' | 'venue_address' | 'starts_at' | 'ends_at' | 'timezone' | 'slug'>;

// 20261025T190000Z
const toUtc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function details(ev: CalEvent, inviteUrl: string) {
  return [
    `¡${ev.honoree}${ev.age != null ? ` cumple ${ev.age}` : ''}! ${ev.phrase}`.trim(),
    ev.time_note,
    ev.dress_code ? `Vestimenta: ${ev.dress_code}` : '',
    `Invitación: ${inviteUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export const eventTitle = (ev: Pick<CalEvent, 'honoree'>) => `Cumpleaños de ${ev.honoree} ⚡`;
const eventLocation = (ev: CalEvent) => [ev.venue_name, ev.venue_address].filter(Boolean).join(', ');

export function googleCalendarUrl(ev: CalEvent, inviteUrl: string) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(ev),
    dates: `${toUtc(ev.starts_at)}/${toUtc(ev.ends_at)}`,
    details: details(ev, inviteUrl),
    location: eventLocation(ev),
    ctz: ev.timezone,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: líneas de máximo 75 octetos
function fold(line: string) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function icsText(ev: CalEvent, inviteUrl: string) {
  const title = eventTitle(ev);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invitaciones by Tapias//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(title)}`,
    'BEGIN:VEVENT',
    `UID:${ev.slug}@invitaciones`,
    `DTSTAMP:${toUtc(new Date().toISOString())}`,
    `DTSTART:${toUtc(ev.starts_at)}`,
    `DTEND:${toUtc(ev.ends_at)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details(ev, inviteUrl))}`,
    `LOCATION:${esc(eventLocation(ev))}`,
    `URL:${inviteUrl}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`Mañana es el cumpleaños de ${ev.honoree}`)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`En 2 horas: cumpleaños de ${ev.honoree}`)}`,
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function mapsQuery(ev: Pick<PublicEvent, 'lat' | 'lng' | 'map_query' | 'venue_name' | 'venue_address'>) {
  if (ev.lat != null && ev.lng != null) return `${ev.lat},${ev.lng}`;
  return ev.map_query || [ev.venue_name, ev.venue_address].filter(Boolean).join(', ');
}
