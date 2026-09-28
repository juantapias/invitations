import type { Metadata } from 'next';
import PanelShell from '@/components/panel/PanelShell';

export const metadata: Metadata = { title: 'Invitados · Panel', robots: { index: false } };

export default async function EventAdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PanelShell loginNext={`/${slug}/admin`}>{children}</PanelShell>;
}
