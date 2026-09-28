import { icsText } from '@/lib/calendar';
import { getPublicEvent, inviteUrl } from '@/lib/events';

// Se sirve como text/calendar: en iPhone abre directo la ventana "Añadir al calendario".
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return new Response('No encontrado', { status: 404 });

  return new Response(icsText(event, inviteUrl(slug)), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${slug}.ics"`,
      'Cache-Control': 'no-cache',
    },
  });
}
