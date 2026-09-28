// Contacto para solicitar invitaciones (botón de la portada): abre WhatsApp con el mensaje ya escrito.
// Número por defecto: +57 333 238 4866. Se puede cambiar sin tocar el código con
// NEXT_PUBLIC_CONTACT_WHATSAPP (solo dígitos, con código de país).
const DEFAULT_WHATSAPP = '573332384866';
const MESSAGE = 'Hola 👋 Quiero solicitar una invitación dinámica para mi evento.';

export function contactUrl() {
  const wa = (process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? '').replace(/\D/g, '') || DEFAULT_WHATSAPP;
  return `https://wa.me/${wa}?text=${encodeURIComponent(MESSAGE)}`;
}
