import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/events';
import type { EventRow } from '@/lib/types';
import EventForm from '@/components/panel/EventForm';
import DeleteEventButton from '@/components/panel/DeleteEventButton';
import ResetClientPassword from '@/components/panel/ResetClientPassword';

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();
  if (!data) notFound();
  const event = data as EventRow;

  return (
    <>
      <div className="pn-head">
        <Link href="/panel" className="pn-back">← Eventos</Link>
        <Link href={`/${event.slug}/admin`} className="pn-back">Ver invitados →</Link>
      </div>
      <h1 className="pn-title">Editar evento</h1>

      {event.client_email && (
        <div className="pn-card pn-client">
          <div>
            <strong>Cliente: {event.client_name || event.client_email}</strong>
            <p className="pn-muted">{event.client_email} · entra en <code>/{event.slug}/admin</code></p>
          </div>
          <ResetClientPassword eventId={event.id} siteUrl={siteUrl()} />
        </div>
      )}

      <EventForm event={event} siteUrl={siteUrl()} />

      <div className="pn-card pn-danger">
        <div>
          <strong>Eliminar evento</strong>
          <p className="pn-muted">Se borran también todos sus enlaces y respuestas. No se puede deshacer.</p>
        </div>
        <DeleteEventButton id={event.id} />
      </div>
    </>
  );
}
