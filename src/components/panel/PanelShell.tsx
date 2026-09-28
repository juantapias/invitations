import Link from 'next/link';
import Logo from './Logo';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth';
import { signOut } from '@/app/login/actions';
import '@/app/panel/panel.css';

// Marco común del panel. Verifica la sesión (y el rol) en el servidor:
// el proxy ya redirige, pero nunca se confía solo en él.
export default async function PanelShell({
  children,
  loginNext,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  loginNext: string;
  requireAdmin?: boolean;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  if (requireAdmin && !viewer.isAdmin) redirect('/mis-eventos');

  return (
    <div className="pn">
      <header className="pn-top">
        <Link href={viewer.isAdmin ? '/panel' : '/mis-eventos'} className="pn-top__brand">
          <Logo />
          <span>{viewer.isAdmin ? 'Administración' : 'Mis invitados'}</span>
        </Link>
        <form action={signOut}>
          <button className="pn-top__out" type="submit" title={viewer.email}>Salir</button>
        </form>
      </header>
      <main className="pn-main">{children}</main>
      <footer className="pn-foot">
        <a href="https://juantapias.dev" target="_blank" rel="noopener">By <strong>Tapias</strong></a>
      </footer>
    </div>
  );
}
