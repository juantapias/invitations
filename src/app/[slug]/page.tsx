import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { googleCalendarUrl, mapsQuery } from '@/lib/calendar';
import { formatLongDate, formatShortDate, formatTime } from '@/lib/dates';
import { getInvite, getPublicEvent, inviteUrl } from '@/lib/events';
import ThemeRenderer from '@/themes/render';
import { getThemeMeta } from '@/themes/registry';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return { themeColor: getThemeMeta(event?.theme).themeColor };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return { title: 'Invitación no encontrada' };
  const title = `¡${event.honoree}${event.age != null ? ` cumple ${event.age}` : ''}! · ${event.phrase}`;
  const description = `${formatLongDate(event.starts_at, event.timezone)} · ${formatTime(event.starts_at, event.timezone)}. Toca para ver la invitación y confirmar tu asistencia.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: `⚡ ${title}`, description, type: 'website' },
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const invite = await getInvite(event.id, first(sp.c));
  const tz = event.timezone;
  const q = mapsQuery(event);
  const hasCoords = event.lat != null && event.lng != null;
  const url = inviteUrl(slug);

  return (
    <ThemeRenderer
      theme={event.theme}
      event={event}
      invite={invite ? { code: invite.code, label: invite.label, maxGuests: invite.max_guests } : null}
      text={{
        date: formatLongDate(event.starts_at, tz),
        time: `${formatTime(event.starts_at, tz)} – ${formatTime(event.ends_at, tz)}`,
        startTime: formatTime(event.starts_at, tz),
        deadline: event.rsvp_deadline ? formatShortDate(event.rsvp_deadline, tz) : null,
      }}
      urls={{
        mapEmbed: `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=es&output=embed`,
        maps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`,
        waze: hasCoords
          ? `https://waze.com/ul?ll=${event.lat},${event.lng}&navigate=yes`
          : `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`,
        google: googleCalendarUrl(event, url),
        ics: `/${slug}/evento.ics`,
        whatsapp: event.contact_whatsapp
          ? `https://wa.me/${event.contact_whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre el cumpleaños de ${event.honoree}.`)}`
          : null,
      }}
      skipIntro={first(sp.intro) === '0'}
      reset={first(sp.reset) === '1'}
    />
  );
}
