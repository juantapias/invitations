import 'server-only';
import { cache } from 'react';
import { createAdminClient } from './supabase/admin';
import { CODE_RE, isValidEventSlug } from './slug';
import { PUBLIC_EVENT_COLUMNS, type InviteRow, type PublicEvent } from './types';


// Datos públicos de una invitación (sin dueño ni fechas internas). cache() evita repetir la
// consulta entre generateMetadata y la página en la misma petición.
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  if (!isValidEventSlug(slug)) return null;
  const { data, error } = await createAdminClient().from('events').select(PUBLIC_EVENT_COLUMNS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return (data as PublicEvent | null) ?? null;
});

export const getInvite = cache(async (eventId: string, code: string | undefined | null): Promise<InviteRow | null> => {
  if (!code || !CODE_RE.test(code)) return null;
  const { data, error } = await createAdminClient()
    .from('invites')
    .select('id, event_id, code, label, max_guests, created_at')
    .eq('event_id', eventId)
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
});

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export const inviteUrl = (slug: string, code?: string | null) =>
  `${siteUrl()}/${slug}${code ? `?c=${code}` : ''}`;
