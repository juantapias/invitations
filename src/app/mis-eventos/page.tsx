import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatLongDate, formatTime } from '@/lib/dates';

// Inicio del cliente: si tiene un solo evento va directo a sus invitados
export default async function ClientHome() {
  const viewer = await getViewer();
  if (viewer?.isAdmin) redirect('/panel');

  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('slug, honoree, age, starts_at, timezone, venue_name')
    .order('starts_at', { ascending: true });

  if (events?.length === 1) redirect(`/${events[0].slug}/admin`);

  return (
    <>
      <h1 className="pn-title">Mis eventos</h1>
      {!events?.length ? (
        <div className="pn-card pn-empty">
          <p><strong>Aún no tienes eventos asignados.</strong></p>
          <p className="pn-muted">Si ya compraste tu invitación, escríbenos para activarla.</p>
          <a className="pn-btn pn-btn--primary" href="https://juantapias.dev" target="_blank" rel="noopener">Contactar</a>
        </div>
      ) : (
        <ul className="pn-events">
          {events.map((ev) => (
            <li key={ev.slug}>
              <Link href={`/${ev.slug}/admin`} className="pn-card pn-event">
                <div className="pn-event__main">
                  <strong className="pn-event__name">{ev.honoree}{ev.age != null && <span> · {ev.age} años</span>}</strong>
                  <span className="pn-muted">{formatLongDate(ev.starts_at, ev.timezone)} · {formatTime(ev.starts_at, ev.timezone)}</span>
                  <span className="pn-muted">{ev.venue_name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
