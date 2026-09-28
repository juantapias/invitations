import type { Metadata } from 'next';
import PanelShell from '@/components/panel/PanelShell';

export const metadata: Metadata = { title: 'Administración', robots: { index: false } };

// Solo administradores de la plataforma: los clientes van a /mis-eventos
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell loginNext="/panel" requireAdmin>
      {children}
    </PanelShell>
  );
}
