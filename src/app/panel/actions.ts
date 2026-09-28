'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePassword, getViewer } from '@/lib/auth';
import { isValidTimeZone, zonedToUtcIso } from '@/lib/dates';
import { RESERVED_SLUGS, isValidEventSlug, toSlug } from '@/lib/slug';
import { getThemeMeta, isThemeId } from '@/themes/registry';

export type Credentials = { name: string; email: string; password: string; slug: string; honoree: string };
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  // Acceso recién creado para el cliente: se muestra una sola vez
  credentials?: Credentials;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? '')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);

function randomCode(len: number) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin 0/o/1/l/i para que sea fácil de dictar
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}


// Cualquier usuario con sesión (cliente o admin). RLS decide qué puede tocar.
async function requireUser() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  return createClient();
}

// Solo el administrador de la plataforma
async function requireAdmin() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (!viewer.isAdmin) redirect('/mis-eventos');
  return { supabase: await createClient(), viewer };
}

// Busca la cuenta del cliente por correo o la crea con una contraseña nueva
async function resolveClient(email: string, name: string): Promise<{ id: string; password?: string } | { error: string }> {
  const admin = createAdminClient();
  const { data: existing, error: findError } = await admin.rpc('get_user_id_by_email', { p_email: email });
  if (findError) {
    console.error('get_user_id_by_email', findError);
    return { error: 'No pudimos verificar el correo del cliente.' };
  }
  if (existing) return { id: existing as string };
  const password = generatePassword();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (error || !data.user) {
    console.error('createUser', error);
    return { error: 'No pudimos crear la cuenta del cliente.' };
  }
  return { id: data.user.id, password };
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

export async function saveEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, viewer } = await requireAdmin();
  const id = str(fd, 'id', 64);
  const e: Record<string, string> = {};

  const honoree = str(fd, 'honoree', 40);
  if (!honoree) e.honoree = 'Escribe el nombre del cumpleañero.';

  const ageRaw = str(fd, 'age', 3);
  const age = ageRaw === '' ? null : Number.parseInt(ageRaw, 10);
  if (age !== null && (!Number.isFinite(age) || age < 0 || age > 120)) e.age = 'Edad no válida.';

  const timezone = str(fd, 'timezone', 60) || 'America/Bogota';
  if (!isValidTimeZone(timezone)) e.timezone = 'Zona horaria no válida.';

  const date = str(fd, 'date', 10);
  const startsAt = zonedToUtcIso(date, str(fd, 'start_time', 5), timezone);
  const endsAt = zonedToUtcIso(date, str(fd, 'end_time', 5), timezone);
  if (!startsAt) e.date = 'Elige la fecha y la hora de inicio.';
  if (!endsAt) e.end_time = 'Elige la hora de finalización.';
  if (startsAt && endsAt && endsAt <= startsAt) e.end_time = 'Debe terminar después de empezar.';

  const deadlineDate = str(fd, 'deadline', 10);
  const rsvpDeadline = deadlineDate ? zonedToUtcIso(deadlineDate, '23:59', timezone) : null;
  if (deadlineDate && !rsvpDeadline) e.deadline = 'Fecha no válida.';
  if (rsvpDeadline && startsAt && rsvpDeadline > startsAt) e.deadline = 'Debe ser antes del evento.';

  const venueName = str(fd, 'venue_name', 120);
  if (!venueName) e.venue_name = 'Escribe el nombre del lugar.';

  const num = (key: string, min: number, max: number) => {
    const raw = str(fd, key, 20).replace(',', '.');
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || n > max) {
      e[key] = 'Número no válido.';
      return null;
    }
    return n;
  };
  const lat = num('lat', -90, 90);
  const lng = num('lng', -180, 180);
  if ((lat === null) !== (lng === null) && !e.lat && !e.lng) e.lng = 'Escribe latitud y longitud, o deja ambas vacías.';

  const maxGuests = Number.parseInt(str(fd, 'max_guests', 3), 10);
  if (!Number.isFinite(maxGuests) || maxGuests < 1 || maxGuests > 50) e.max_guests = 'Entre 1 y 50.';

  const whatsapp = str(fd, 'contact_whatsapp', 20).replace(/\D/g, '');
  if (whatsapp.length > 15) e.contact_whatsapp = 'Número demasiado largo.';

  const theme = str(fd, 'theme', 40);
  if (!isThemeId(theme)) e.theme = 'Elige un tema.';

  const slug = toSlug(str(fd, 'slug', 120)); // mismo formato que el campo, aunque llegue sin formatear
  if (slug && RESERVED_SLUGS.has(slug)) e.slug = 'Esa palabra está reservada, elige otra.';
  else if (slug && !isValidEventSlug(slug)) e.slug = 'Entre 3 y 60 caracteres: minúsculas, números y guiones (ej. benjamin).';

  const clientName = str(fd, 'client_name', 80);
  const clientEmail = str(fd, 'client_email', 254).toLowerCase();
  if (clientEmail && !EMAIL_RE.test(clientEmail)) e.client_email = 'Correo no válido.';

  if (Object.keys(e).length) return { error: 'Revisa los campos marcados.', fieldErrors: e };

  // El dueño del evento es el cliente (por su correo). Sin correo, queda a nombre del administrador.
  let ownerId = viewer.id;
  let newPassword: string | undefined;
  if (clientEmail) {
    const client = await resolveClient(clientEmail, clientName);
    if ('error' in client) return { error: client.error, fieldErrors: { client_email: client.error } };
    ownerId = client.id;
    newPassword = client.password;
  }

  const defaults = getThemeMeta(theme).defaults;
  const row = {
    theme,
    honoree,
    age,
    phrase: str(fd, 'phrase', 60) || defaults.phrase,
    message: str(fd, 'message', 400) || defaults.message,
    starts_at: startsAt!,
    ends_at: endsAt!,
    timezone,
    rsvp_deadline: rsvpDeadline,
    time_note: str(fd, 'time_note', 120),
    venue_name: venueName,
    venue_address: str(fd, 'venue_address', 200),
    map_query: str(fd, 'map_query', 200),
    lat,
    lng,
    dress_code: str(fd, 'dress_code', 160),
    max_guests: maxGuests,
    contact_whatsapp: whatsapp,
    owner_id: ownerId,
    client_name: clientEmail ? clientName : '',
    client_email: clientEmail,
  };

  let finalSlug = slug;
  if (id) {
    const { data, error } = await supabase.from('events').update(slug ? { ...row, slug } : row).eq('id', id).select('slug').single();
    if (error) return dbError(error);
    finalSlug = data.slug;
  } else if (slug) {
    const { error } = await supabase.from('events').insert({ ...row, slug });
    if (error) return dbError(error);
  } else {
    // Enlace automático y fácil de recordar: /benjamin → /benjamin-6 → /benjamin-6-2026 → /benjamin-6-x7k2
    const base = toSlug(honoree, { max: 40 }) || 'evento';
    const year = startsAt!.slice(0, 4);
    const candidates = [base, age != null ? `${base}-${age}` : null, `${base}${age != null ? `-${age}` : ''}-${year}`]
      .filter((c): c is string => !!c && isValidEventSlug(c));
    candidates.push(`${base}-${randomCode(4)}`);
    let saved = false;
    for (const candidate of candidates) {
      const { error } = await supabase.from('events').insert({ ...row, slug: candidate });
      if (!error) {
        finalSlug = candidate;
        saved = true;
        break;
      }
      if (error.code !== '23505') return dbError(error);
    }
    if (!saved) return { error: 'No pudimos generar un enlace libre. Escribe uno en «Enlace».' };
  }

  revalidatePath('/panel');
  if (newPassword) {
    // Cuenta nueva: se muestra el acceso una sola vez antes de continuar
    return { ok: true, credentials: { name: clientName, email: clientEmail, password: newPassword, slug: finalSlug, honoree } };
  }
  redirect(`/${finalSlug}/admin`);
}

// Genera una contraseña nueva para el cliente del evento (p. ej. si la olvidó)
export async function resetClientPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, viewer } = await requireAdmin();
  const { data: ev } = await supabase
    .from('events')
    .select('owner_id, client_name, client_email, slug, honoree')
    .eq('id', str(fd, 'id', 64))
    .maybeSingle();
  if (!ev) return { error: 'Evento no encontrado.' };
  if (!ev.client_email || ev.owner_id === viewer.id) return { error: 'Este evento no tiene un cliente asignado.' };
  const password = generatePassword();
  const { error } = await createAdminClient().auth.admin.updateUserById(ev.owner_id, { password });
  if (error) {
    console.error('updateUserById', error);
    return { error: 'No pudimos cambiar la contraseña.' };
  }
  return { ok: true, credentials: { name: ev.client_name, email: ev.client_email, password, slug: ev.slug, honoree: ev.honoree } };
}

function dbError(error: { code?: string; message: string }): FormState {
  if (error.code === '23505') return { error: 'Ese enlace ya está en uso.', fieldErrors: { slug: 'Ya existe, elige otro.' } };
  console.error('saveEvent', error);
  return { error: 'No pudimos guardar el evento. Intenta de nuevo.' };
}

export async function deleteEvent(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('events').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/panel');
  redirect('/panel');
}

// ---------------------------------------------------------------------------
// Enlaces personalizados
// ---------------------------------------------------------------------------

export async function createInvite(_prev: FormState, fd: FormData): Promise<FormState> {
  const supabase = await requireUser();
  const eventId = str(fd, 'event_id', 64);
  const label = str(fd, 'label', 80);
  const maxGuests = Number.parseInt(str(fd, 'max_guests', 3), 10);
  if (!label) return { error: 'Escribe el nombre de la familia o invitado.' };
  if (!Number.isFinite(maxGuests) || maxGuests < 1 || maxGuests > 50) return { error: 'Los cupos deben estar entre 1 y 50.' };

  // Reintenta si el código aleatorio ya existe (muy improbable)
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.from('invites').insert({ event_id: eventId, label, max_guests: maxGuests, code: randomCode(8) });
    if (!error) {
      revalidatePath('/[slug]/admin', 'page');
      return { ok: true };
    }
    if (error.code !== '23505') {
      console.error('createInvite', error);
      return { error: 'No pudimos crear el enlace.' };
    }
  }
  return { error: 'No pudimos crear el enlace. Intenta de nuevo.' };
}

export async function deleteInvite(fd: FormData) {
  const supabase = await requireUser();
  await supabase.from('invites').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/[slug]/admin', 'page');
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

export async function deleteResponse(fd: FormData) {
  const supabase = await requireUser();
  await supabase.from('responses').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/[slug]/admin', 'page');
}
