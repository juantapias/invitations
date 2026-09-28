import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env';

// Refresca la sesión en cada petición del panel y protege sus rutas.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // No poner código entre createServerClient y getClaims(): refresca el token si expiró.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims;
  const { pathname } = request.nextUrl;

  const isPanel = pathname.startsWith('/panel') || pathname === '/mis-eventos' || /^\/[^/]+\/admin(\/|$)/.test(pathname);
  if (!isLoggedIn && isPanel) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (isLoggedIn && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/mis-eventos'; // desde ahí el admin va a /panel y el cliente a su evento
    url.search = '';
    return NextResponse.redirect(url);
  }
  return response;
}
