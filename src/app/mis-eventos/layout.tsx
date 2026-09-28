import type { Metadata } from 'next';
import PanelShell from '@/components/panel/PanelShell';

export const metadata: Metadata = { title: 'Mis eventos', robots: { index: false } };

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell loginNext="/mis-eventos">{children}</PanelShell>;
}
