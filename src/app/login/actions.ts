'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type LoginState = { error?: string; email?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '');
  if (!email || !password) return { error: 'Escribe tu correo y tu contraseña.', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error: error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos.' : 'No pudimos iniciar sesión. Intenta de nuevo.',
      email,
    };
  }
  // Solo rutas internas del panel (evita redirecciones abiertas)
  const safe = /^\/(panel|mis-eventos)(\/[\w/-]*)?$/.test(next) || /^\/[a-z0-9-]+\/admin(\/[\w/-]*)?$/.test(next);
  redirect(safe ? next : '/mis-eventos');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
