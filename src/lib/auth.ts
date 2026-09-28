import 'server-only';
import { cache } from 'react';
import { createClient } from './supabase/server';

export type Viewer = { id: string; email: string; isAdmin: boolean };

// Quién está conectado y si es administrador de la plataforma. cache(): una consulta por petición.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const { data: admin } = await supabase.from('platform_admins').select('user_id').eq('user_id', claims.sub).maybeSingle();
  return { id: claims.sub, email: String(claims.email ?? ''), isAdmin: !!admin };
});

// Contraseña legible para enviar por WhatsApp: 3 bloques de 4 (sin 0/O/1/l/I)
export function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return `${chars.slice(0, 4).join('')}-${chars.slice(4, 8).join('')}-${chars.slice(8).join('')}`;
}
