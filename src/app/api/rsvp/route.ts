import { createAdminClient } from '@/lib/supabase/admin';
import { getInvite, getPublicEvent } from '@/lib/events';

const DEVICE_RE = /^[A-Za-z0-9-]{8,64}$/;

// Limpia texto libre: sin caracteres de control y con largo máximo
const clean = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);

const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('Solicitud inválida');
  }

  const slug = String(body.slug ?? '');
  const deviceId = String(body.deviceId ?? '');
  const name = clean(body.name, 80);
  const message = clean(body.message, 300);
  const attending = body.attending === true;

  if (!DEVICE_RE.test(deviceId) || !name) return fail('Datos incompletos');

  const event = await getPublicEvent(slug);
  if (!event) return fail('Invitación no encontrada', 404);

  if (event.rsvp_deadline && Date.now() > new Date(event.rsvp_deadline).getTime()) {
    return fail('Las confirmaciones ya cerraron', 409);
  }

  // El cupo lo decide el servidor: el del enlace personalizado o el general del evento
  const invite = await getInvite(event.id, typeof body.code === 'string' ? body.code : null);
  const max = invite?.max_guests ?? event.max_guests;
  const requested = Number.parseInt(String(body.guests), 10);
  const guests = attending ? Math.max(1, Math.min(max, Number.isFinite(requested) ? requested : 1)) : 0;

  const { error } = await createAdminClient()
    .from('responses')
    .upsert(
      { event_id: event.id, invite_id: invite?.id ?? null, device_id: deviceId, name, attending, guests, message },
      { onConflict: 'event_id,device_id' }
    );

  if (error) {
    console.error('rsvp upsert', error);
    return fail('No pudimos guardar tu respuesta', 500);
  }
  return Response.json({ ok: true, guests });
}
