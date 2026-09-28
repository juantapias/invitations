import type { Metadata, Viewport } from 'next';
import { Bangers, Luckiest_Guy, Nunito } from 'next/font/google';
import './globals.css';

const luckiest = Luckiest_Guy({ weight: '400', subsets: ['latin'], variable: '--font-luckiest', display: 'swap' });
// Bangers: rotulado cómic del panel
const bangers = Bangers({ weight: '400', subsets: ['latin'], variable: '--font-bangers', display: 'swap' });
const nunito = Nunito({ weight: ['600', '700', '800', '900'], subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Invitaciones dinámicas · By Tapias', template: '%s' },
  description: 'Invitaciones digitales con confirmación de asistencia, calendario y mapa.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${luckiest.variable} ${bangers.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
