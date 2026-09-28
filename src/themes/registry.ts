// Catálogo de temas (solo metadatos: se puede usar en el panel sin cargar los diseños).
// Para agregar un tema: crea src/themes/<id>/ con meta.ts, Invitation.tsx y styles.css (aislado bajo .theme-<id>),
// sus íconos en public/themes/<id>/ (favicon.svg, favicon-32.png, apple-icon.png) y regístralo aquí y en render.tsx.
import type { ThemeMeta } from './shared/types';
import { pikachuMeta } from './pikachu/meta';
import { galaxiaMeta } from './galaxia/meta';

export const THEMES: ThemeMeta[] = [galaxiaMeta, pikachuMeta];

export const DEFAULT_THEME = 'pikachu';

export function getThemeMeta(id: string | null | undefined): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

export const isThemeId = (id: string) => THEMES.some((t) => t.id === id);

// Íconos del tema: public/themes/<id>/favicon.svg, favicon-32.png y apple-icon.png (180×180, fondo sólido)
export function themeIcons(id: string | null | undefined) {
  const base = `/themes/${getThemeMeta(id).id}`;
  return {
    icon: [
      { url: `${base}/favicon.svg`, type: 'image/svg+xml' },
      { url: `${base}/favicon-32.png`, sizes: '32x32', type: 'image/png' },
    ],
    apple: `${base}/apple-icon.png`,
  };
}
