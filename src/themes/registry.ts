// Catálogo de temas (solo metadatos: se puede usar en el panel sin cargar los diseños).
// Para agregar un tema: crea src/themes/<id>/ con meta.ts, Invitation.tsx y styles.css (aislado bajo .theme-<id>),
// y regístralo aquí y en render.tsx.
import type { ThemeMeta } from './shared/types';
import { pikachuMeta } from './pikachu/meta';
import { galaxiaMeta } from './galaxia/meta';

export const THEMES: ThemeMeta[] = [galaxiaMeta, pikachuMeta];

export const DEFAULT_THEME = 'pikachu';

export function getThemeMeta(id: string | null | undefined): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

export const isThemeId = (id: string) => THEMES.some((t) => t.id === id);
