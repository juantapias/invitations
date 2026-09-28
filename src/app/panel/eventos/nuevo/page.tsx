import Link from 'next/link';
import EventForm from '@/components/panel/EventForm';
import { siteUrl } from '@/lib/events';

export default function NewEventPage() {
  return (
    <>
      <Link href="/panel" className="pn-back">← Eventos</Link>
      <h1 className="pn-title">Nuevo evento</h1>
      <EventForm siteUrl={siteUrl()} />
    </>
  );
}
