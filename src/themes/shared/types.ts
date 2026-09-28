import type { PublicEvent } from '@/lib/types';

// Todo lo que recibe cualquier tema. El servidor ya formatea textos y arma URLs.
export type InvitationProps = {
  event: PublicEvent;
  invite: { code: string; label: string; maxGuests: number } | null;
  text: { date: string; time: string; startTime: string; deadline: string | null };
  urls: { mapEmbed: string; maps: string; waze: string; google: string; ics: string; whatsapp: string | null };
  skipIntro: boolean;
  reset: boolean;
};

export type ThemeMeta = {
  id: string;
  name: string;
  description: string;
  // Solo para uso personal (marcas registradas) — no vender
  personalUseOnly?: boolean;
  themeColor: string;
  swatch: [string, string, string];
  defaults: { phrase: string; message: string };
};
