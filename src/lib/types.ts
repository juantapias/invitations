export type EventRow = {
  id: string;
  owner_id: string;
  slug: string;
  theme: string;
  honoree: string;
  age: number | null;
  phrase: string;
  message: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  rsvp_deadline: string | null;
  time_note: string;
  venue_name: string;
  venue_address: string;
  map_query: string;
  lat: number | null;
  lng: number | null;
  dress_code: string;
  max_guests: number;
  contact_whatsapp: string;
  client_name: string;
  client_email: string;
  created_at: string;
  updated_at: string;
};

export type InviteRow = {
  id: string;
  event_id: string;
  code: string;
  label: string;
  max_guests: number;
  created_at: string;
};

export type ResponseRow = {
  id: string;
  event_id: string;
  invite_id: string | null;
  device_id: string;
  name: string;
  attending: boolean;
  guests: number;
  message: string;
  created_at: string;
  updated_at: string;
};

// Columnas que se pueden mostrar públicamente en la invitación
export const PUBLIC_EVENT_COLUMNS =
  'id, slug, theme, honoree, age, phrase, message, starts_at, ends_at, timezone, rsvp_deadline, time_note, venue_name, venue_address, map_query, lat, lng, dress_code, max_guests, contact_whatsapp';

// Sin dueño ni datos del cliente: esto llega al navegador de los invitados
export type PublicEvent = Omit<EventRow, 'owner_id' | 'client_name' | 'client_email' | 'created_at' | 'updated_at'>;
