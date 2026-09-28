import Link from 'next/link';
import Logo from '@/components/panel/Logo';
import { contactUrl } from '@/lib/contact';
import './panel/panel.css';

export default function Home() {
  return (
    <main className="pn-auth">
      <div className="pn-auth__box pn-center">
        <div className="pn-brand" style={{ justifyContent: 'center' }}>
          <Logo />
        </div>
        <h1 className="pn-title">Invitaciones dinámicas</h1>
        <p className="pn-muted">Confirmación de asistencia, calendario, mapa y panel de invitados en vivo.</p>
        <a className="pn-btn pn-btn--pink pn-btn--block pn-btn--lg" href={contactUrl()} target="_blank" rel="noopener noreferrer">
          ¡Solicitar mi invitación!
        </a>
        <Link className="pn-btn pn-btn--block" href="/mis-eventos">Ya tengo una: entrar</Link>
        <p className="pn-muted">
          By <a href="https://juantapias.dev" target="_blank" rel="noopener"><strong>Tapias</strong></a>
        </p>
      </div>
    </main>
  );
}
