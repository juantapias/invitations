import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatLongDate, formatTime } from '@/lib/dates';
import { getThemeMeta } from '@/themes/registry';
import type { EventRow } from '@/lib/types';

// Fuera del componente: se evalúa en cada petición (la página es dinámica por usar cookies)
const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

type Row = Pick<EventRow, 'id' | 'slug' | 'honoree' | 'age' | 'starts_at' | 'timezone' | 'venue_name' | 'theme' | 'client_name' | 'client_email'>;

export default async function AdminHome() {
  const supabase = await createClient();
  // Como administrador, RLS devuelve todos los eventos de la plataforma
  const [{ data: events }, { data: responses }] = await Promise.all([
    supabase.from('events').select('id, slug, honoree, age, starts_at, timezone, venue_name, theme, client_name, client_email').order('starts_at', { ascending: true }),
    supabase.from('responses').select('event_id, attending, guests'),
  ]);

  const stats = new Map<string, { people: number; yes: number; no: number }>();
  for (const r of responses ?? []) {
    const s = stats.get(r.event_id) ?? { people: 0, yes: 0, no: 0 };
    if (r.attending) {
      s.people += r.guests;
      s.yes += 1;
    } else s.no += 1;
    stats.set(r.event_id, s);
  }
  const list = (events ?? []) as Row[];

  return (
    <>
      <div className="pn-head">
        <h1 className="pn-title">Eventos</h1>
        <Link className="pn-btn pn-btn--primary" href="/panel/eventos/nuevo">+ Nuevo evento</Link>
      </div>

      {list.length === 0 ? (
        <div className="pn-card pn-empty">
          <p><strong>Aún no hay eventos.</strong></p>
          <p className="pn-muted">Crea el primero, elige su tema y asígnalo a tu cliente.</p>
          <Link className="pn-btn pn-btn--primary" href="/panel/eventos/nuevo">Crear evento</Link>
        </div>
      ) : (
        <ul className="pn-events">
          {list.map((ev) => {
            const s = stats.get(ev.id) ?? { people: 0, yes: 0, no: 0 };
            const past = isPast(ev.starts_at);
            return (
              <li key={ev.id} className={`pn-card pn-event${past ? ' is-past' : ''}`}>
                <div className="pn-event__main">
                  <Link href={`/panel/eventos/${ev.slug}`} className="pn-event__name">
                    {ev.honoree}
                    {ev.age != null && <span> · {ev.age} años</span>}
                  </Link>
                  <span className="pn-muted">
                    {formatLongDate(ev.starts_at, ev.timezone)} · {formatTime(ev.starts_at, ev.timezone)}
                  </span>
                  <span className="pn-muted">Cliente: {ev.client_email ? ev.client_name || ev.client_email : 'sin asignar'}</span>
                  <span className="pn-slug">/{ev.slug}</span>
                </div>
                <div className="pn-event__stat">
                  <b>{s.people}</b>
                  <span>personas</span>
                </div>
                <div className="pn-event__chips">
                  <span className="pn-chip">{getThemeMeta(ev.theme).name}</span>
                  <span className="pn-chip pn-chip--yes">{s.yes} sí</span>
                  <span className="pn-chip pn-chip--no">{s.no} no</span>
                  {past && <span className="pn-chip">Finalizado</span>}
                </div>
                <div className="pn-event__actions">
                  <Link className="pn-btn pn-btn--sm pn-btn--primary" href={`/${ev.slug}/admin`}>Invitados</Link>
                  <Link className="pn-btn pn-btn--sm" href={`/panel/eventos/${ev.slug}`}>Editar</Link>
                  <a className="pn-btn pn-btn--sm" href={`/${ev.slug}`} target="_blank" rel="noopener">Invitación</a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
