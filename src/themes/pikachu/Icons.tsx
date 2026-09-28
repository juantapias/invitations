// Sprite de íconos reutilizables (<use href="#i-...">)
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13.5 1.5 4 13.5h6.5L9 22.5l11-13h-6.8z" fill="currentColor" /></symbol>
      <symbol id="i-ball" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#1D2C5E" strokeWidth="2" /><path d="M1.5 12a10.5 10.5 0 0 1 21 0z" fill="#E3350D" stroke="#1D2C5E" strokeWidth="2" /><circle cx="12" cy="12" r="3.4" fill="#fff" stroke="#1D2C5E" strokeWidth="2" /></symbol>
      <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.6" fill="currentColor" /></symbol>
      <symbol id="i-shirt" viewBox="0 0 24 24"><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></symbol>
      <symbol id="i-alarm" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" /></symbol>
      <symbol id="i-nav" viewBox="0 0 24 24"><path d="M3 11 21 3l-8 18-2-8z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" /></symbol>
    </svg>
  );
}

export function Icon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#i-${id}`} />
    </svg>
  );
}
