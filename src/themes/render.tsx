'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { InvitationProps } from './shared/types';
import { DEFAULT_THEME } from './registry';

// Cada tema es un chunk aparte (código + CSS): una invitación solo descarga el de su tema.
// Tiene que ser un Client Component: next/dynamic no divide el código cuando se llama desde el servidor.
const themes: Record<string, ComponentType<InvitationProps>> = {
  pikachu: dynamic(() => import('./pikachu/Invitation')),
  galaxia: dynamic(() => import('./galaxia/Invitation')),
};

export default function ThemeRenderer({ theme, ...props }: InvitationProps & { theme: string }) {
  const Theme = themes[theme] ?? themes[DEFAULT_THEME];
  return <Theme {...props} />;
}
