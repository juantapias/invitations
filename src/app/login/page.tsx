import type { Metadata } from 'next';
import Logo from '@/components/panel/Logo';
import LoginForm from './LoginForm';
import '../panel/panel.css';

export const metadata: Metadata = { title: 'Entrar · Panel de invitados', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="pn-auth">
      <div className="pn-auth__box">
        <div className="pn-brand">
          <Logo />
          <div>
            <h1 className="pn-title">Panel de invitados</h1>
            <p className="pn-muted">Entra para ver quién asistirá a tus eventos.</p>
          </div>
        </div>
        <LoginForm next={next ?? ''} />
        <p className="pn-muted pn-center">¿No tienes cuenta? Escríbenos en <a href="https://juantapias.dev" target="_blank" rel="noopener">juantapias.dev</a></p>
      </div>
    </main>
  );
}
