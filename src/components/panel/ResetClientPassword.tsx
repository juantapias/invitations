'use client';

import { startTransition, useActionState, useState } from 'react';
import { resetClientPassword, type FormState } from '@/app/panel/actions';
import ClientCredentials from './ClientCredentials';
import Modal from './Modal';

export default function ResetClientPassword({ eventId, siteUrl }: { eventId: string; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetClientPassword, {});
  const [open, setOpen] = useState(false);
  // Resultado ya visto: al volver a abrir la ventana se pide confirmación de nuevo
  const [seen, setSeen] = useState<FormState | null>(null);
  const result = state.credentials && state !== seen ? state.credentials : null;

  function close() {
    if (pending) return;
    if (result) setSeen(state);
    setOpen(false);
  }

  function generate() {
    const fd = new FormData();
    fd.set('id', eventId);
    startTransition(() => action(fd));
  }

  return (
    <>
      <button type="button" className="pn-btn pn-btn--sm" onClick={() => setOpen(true)}>
        Nueva contraseña
      </button>

      <Modal open={open} onClose={close} labelledBy="reset-pwd-title">
        {result ? (
          <>
            <h2 className="pn-modal__title" id="reset-pwd-title">¡Contraseña nueva lista!</h2>
            <ClientCredentials credentials={result} siteUrl={siteUrl} />
            <button type="button" className="pn-btn pn-btn--primary pn-btn--block" onClick={close} autoFocus>
              Listo
            </button>
          </>
        ) : (
          <>
            <span className="pn-modal__icon" aria-hidden="true">🔑</span>
            <h2 className="pn-modal__title" id="reset-pwd-title">¿Generar una contraseña nueva?</h2>
            <p className="pn-muted">
              La contraseña actual del cliente <strong>dejará de funcionar</strong> y tendrás que enviarle la nueva.
            </p>
            {state.error && state !== seen && <p className="pn-error" role="alert">{state.error}</p>}
            <div className="pn-modal__actions">
              <button type="button" className="pn-btn" onClick={close} disabled={pending} autoFocus>
                Cancelar
              </button>
              <button type="button" className="pn-btn pn-btn--pink" onClick={generate} disabled={pending}>
                {pending ? 'Generando…' : 'Sí, generar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
