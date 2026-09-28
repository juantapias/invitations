import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', background: '#FFCB05', color: '#1D2C5E' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-luckiest)', fontWeight: 400, fontSize: '2rem', margin: 0 }}>Invitación no encontrada</h1>
        <p>Revisa que el enlace esté completo o pídele uno nuevo a quien te invitó.</p>
        <Link href="/" style={{ color: '#1D2C5E', fontWeight: 900 }}>Ir al inicio</Link>
      </div>
    </main>
  );
}
