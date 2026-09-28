import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Solo el panel y el login necesitan sesión; la invitación pública queda fuera (más rápida).
  matcher: ['/panel/:path*', '/mis-eventos', '/login', '/:slug/admin/:path*'],
};
