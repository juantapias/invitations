import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDateTimeShort, formatLongDate, formatShortDate, formatTime } from '@/lib/dates';
import { inviteUrl } from '@/lib/events';
import { isValidEventSlug } from '@/lib/slug';
import { getViewer } from '@/lib/auth';
import { getThemeMeta } from '@/themes/registry';
import type { EventRow, InviteRow, ResponseRow } from '@/lib/types';
import GuestBoard from '@/components/panel/GuestBoard';
import InviteLinks from '@/components/panel/InviteLinks';
import CopyButton from '@/components/panel/CopyButton';

export default async function EventDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidEventSlug(slug)) notFound();
  const [supabase, viewer] = await Promise.all([createClient(), getViewer()]);
  const isAdmin = !!viewer?.isAdmin;
  // RLS: si el evento no es de este cliente (ni eres admin), no aparece → 404
  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  if (!event) notFound();
  const ev = event as EventRow;
  const [{ data: invites }, { data: responses }] = await Promise.all([
    supabase.from('invites').select('*').eq('event_id', ev.id).order('created_at', { ascending: true }),
    supabase.from('responses').select('*').eq('event_id', ev.id).order('updated_at', { ascending: false }),
  ]);
  const theme = getThemeMeta(ev.theme);
  const url = inviteUrl(ev.slug);

  return (
    <>
      {isAdmin ? (
        <div className="pn-head">
          <Link href="/panel" className="pn-back">← Eventos</Link>
          <span className="pn-role">Vista de administrador</span>
        </div>
      ) : (
        <ClientBackLink />
      )}
      <div className="pn-card pn-hero">
        <div>
          <h1 className="pn-title">
            {ev.honoree}
            {ev.age != null && <span className="pn-title__sub"> · {ev.age} años</span>}
          </h1>
          <p className="pn-muted">
            {formatLongDate(ev.starts_at, ev.timezone)} · {formatTime(ev.starts_at, ev.timezone)} – {formatTime(ev.ends_at, ev.timezone)}
          </p>
          <p className="pn-muted">{ev.venue_name}</p>
          {isAdmin && (
            <p className="pn-muted">
              Tema: {theme.name} · Cliente: {ev.client_email ? ev.client_name || ev.client_email : 'sin asignar'} · <span className="pn-slug">/{ev.slug}</span>
            </p>
          )}
          {ev.rsvp_deadline && (
            <p className="pn-muted">Confirmaciones hasta el {formatShortDate(ev.rsvp_deadline, ev.timezone)}</p>
          )}
        </div>
        <div className="pn-hero__actions">
          <a className="pn-btn pn-btn--primary" href={`/${ev.slug}`} target="_blank" rel="noopener">Ver invitación</a>
          <CopyButton text={url} label="Copiar enlace general" />
          {isAdmin && <Link className="pn-btn" href={`/panel/eventos/${ev.slug}`}>Editar evento</Link>}
        </div>
      </div>

      <GuestBoard
        eventId={ev.id}
        honoree={ev.honoree}
        // Las fechas se formatean aquí (servidor) para que el HTML coincida al hidratar
        responses={((responses ?? []) as ResponseRow[]).map((r) => ({ ...r, updatedLabel: formatDateTimeShort(r.updated_at, ev.timezone) }))}
        invites={(invites ?? []) as InviteRow[]}
      />

      <InviteLinks
        eventId={ev.id}
        baseUrl={url}
        honoree={ev.honoree}
        defaultMax={ev.max_guests}
        invites={(invites ?? []) as InviteRow[]}
        answered={Array.from(new Set((responses ?? []).map((r) => r.invite_id).filter(Boolean) as string[]))}
      />
    </>
  );
}

// El cliente con varios eventos puede volver a su lista; con uno solo no hace falta
async function ClientBackLink() {
  const supabase = await createClient();
  const { count } = await supabase.from('events').select('id', { count: 'exact', head: true });
  if (!count || count < 2) return null;
  return <Link href="/mis-eventos" className="pn-back">← Mis eventos</Link>;
}
