'use client';

import { startTransition, useActionState, useEffect, useRef } from 'react';
import { createInvite, deleteInvite, type FormState } from '@/app/panel/actions';
import type { InviteRow } from '@/lib/types';
import CopyButton from './CopyButton';

export default function InviteLinks({
  eventId,
  baseUrl,
  honoree,
  defaultMax,
  invites,
  answered,
}: {
  eventId: string;
  baseUrl: string;
  honoree: string;
  defaultMax: number;
  invites: InviteRow[];
  answered: string[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createInvite, {});
  const formRef = useRef<HTMLFormElement>(null);
  const answeredSet = new Set(answered);

  // Limpia el formulario solo cuando el enlace se creó bien
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>('input[name="label"]')?.focus();
    }
  }, [state]);

  const linkFor = (code: string) => `${baseUrl}?c=${code}`;
  const whatsappFor = (inv: InviteRow) =>
    `https://wa.me/?text=${encodeURIComponent(
      `¡Hola, ${inv.label}! 😊\n\nCon mucha alegría te invitamos a celebrar el cumpleaños de ${honoree} ⚡\n\nAquí encuentras todos los detalles y puedes confirmar tu asistencia:\n${linkFor(inv.code)}`
    )}`;

  return (
    <section className="pn-section" aria-labelledby="t-links">
      <div className="pn-section__head">
        <h2 className="pn-h2" id="t-links">Enlaces por familia</h2>
      </div>
      <p className="pn-muted">
        Cada familia recibe su propio enlace: la invitación la saluda por su nombre, limita cuántas personas puede confirmar y te
        deja ver quién falta por responder.
      </p>

      <form
        ref={formRef}
        className="pn-card pn-invite-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        <input type="hidden" name="event_id" value={eventId} />
        <label className="pn-field">
          <span>Familia o invitado</span>
          <input name="label" required maxLength={80} placeholder="Nombre de la familia o invitado" autoCapitalize="words" />
        </label>
        <label className="pn-field pn-field--sm">
          <span>Cupos</span>
          <input name="max_guests" type="number" inputMode="numeric" min={1} max={50} defaultValue={defaultMax} />
        </label>
        <button className="pn-btn pn-btn--primary" type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear enlace'}
        </button>
        {state.error && <p className="pn-error" role="alert">{state.error}</p>}
      </form>

      {invites.length > 0 && (
        <ul className="pn-links">
          {invites.map((inv) => (
            <li key={inv.id} className="pn-card pn-link">
              <div className="pn-link__main">
                <strong>{inv.label}</strong>
                <span className="pn-muted">
                  {inv.max_guests} {inv.max_guests === 1 ? 'cupo' : 'cupos'} ·{' '}
                  {answeredSet.has(inv.id) ? <span className="pn-ok">Respondió</span> : 'Pendiente'}
                </span>
                <code className="pn-link__url">{linkFor(inv.code)}</code>
              </div>
              <div className="pn-link__actions">
                <CopyButton text={linkFor(inv.code)} label="Copiar" className="pn-btn pn-btn--sm" />
                <a className="pn-btn pn-btn--sm pn-btn--wa" href={whatsappFor(inv)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <form
                  action={deleteInvite}
                  onSubmit={(e) => {
                    if (!confirm(`¿Eliminar el enlace de ${inv.label}? Si ya respondió, su respuesta se conserva.`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={inv.id} />
                  <input type="hidden" name="event_id" value={eventId} />
                  <button className="pn-btn pn-btn--sm pn-btn--ghost-danger" type="submit" aria-label={`Eliminar enlace de ${inv.label}`}>
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
