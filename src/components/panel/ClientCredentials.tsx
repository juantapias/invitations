'use client';

import Link from 'next/link';
import type { Credentials } from '@/app/panel/actions';
import CopyButton from './CopyButton';

// Acceso del cliente. La contraseña solo se ve aquí: no se guarda en ningún lado.
export default function ClientCredentials({ credentials: c, siteUrl, continueHref }: { credentials: Credentials; siteUrl: string; continueHref?: string }) {
  const invitation = `${siteUrl}/${c.slug}`;
  const admin = `${siteUrl}/${c.slug}/admin`;
  const message = [
    `¡Hola${c.name ? `, ${c.name}` : ''}! 🎉 Ya está lista la invitación de ${c.honoree}.`,
    '',
    `💌 Invitación para compartir con tus invitados:`,
    invitation,
    '',
    `📋 Tu panel para ver quién asiste:`,
    admin,
    `Usuario: ${c.email}`,
    `Contraseña: ${c.password}`,
    '',
    'Guarda este mensaje para volver a entrar cuando quieras.',
  ].join('\n');

  return (
    <div className="pn-card pn-cred" role="status">
      <strong className="pn-cred__title">🔑 Acceso del cliente</strong>
      <p className="pn-muted">Envíaselo ahora: por seguridad, la contraseña no se vuelve a mostrar (puedes generar otra desde el evento).</p>
      <dl className="pn-cred__list">
        <dt>Panel</dt><dd><code>{admin}</code></dd>
        <dt>Usuario</dt><dd><code>{c.email}</code></dd>
        <dt>Contraseña</dt><dd><code className="pn-cred__pwd">{c.password}</code></dd>
      </dl>
      <div className="pn-cred__actions">
        <a className="pn-btn pn-btn--wa" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
        <CopyButton text={message} label="Copiar mensaje" />
        {continueHref && <Link className="pn-btn pn-btn--primary" href={continueHref}>Continuar al evento</Link>}
      </div>
    </div>
  );
}
