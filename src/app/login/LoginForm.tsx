'use client';

import { useActionState } from 'react';
import { signIn, type LoginState } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="pn-card pn-form">
      <input type="hidden" name="next" value={next} />
      <label className="pn-field">
        <span>Correo</span>
        <input name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.email} />
      </label>
      <label className="pn-field">
        <span>Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && <p className="pn-error" role="alert">{state.error}</p>}
      <button className="pn-btn pn-btn--primary pn-btn--block" type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
