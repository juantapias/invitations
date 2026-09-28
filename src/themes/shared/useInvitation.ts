'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { InvitationProps } from './types';
import { prefersReducedMotion, vibrate } from './effects';

// Lógica común a todos los temas: confirmación de asistencia, cuenta regresiva y calendario.
// Los temas solo se encargan del diseño.

type Stored = {
  deviceId: string;
  name: string;
  attending: boolean;
  guests: number;
  message: string;
  cal?: boolean;
};

type Platform = 'ios' | 'android' | 'mac' | 'other';

const storeKey = (eventId: string) => `rsvp:${eventId}`;

function readStore(eventId: string): Stored | null {
  try {
    return JSON.parse(localStorage.getItem(storeKey(eventId)) ?? 'null');
  } catch {
    return null;
  }
}

function writeStore(eventId: string, value: Stored) {
  try {
    localStorage.setItem(storeKey(eventId), JSON.stringify(value));
  } catch {}
}

function newDeviceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function detectPlatform(): { platform: Platform; inApp: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const platform: Platform = ios ? 'ios' : /Android/i.test(ua) ? 'android' : /Macintosh/.test(ua) ? 'mac' : 'other';
  // Navegadores internos de Instagram/Facebook/TikTok no abren archivos de calendario
  const inApp = /FBAN|FBAV|Instagram|Line\/|musical_ly|TikTok/i.test(ua);
  return { platform, inApp };
}

const pad = (n: number) => String(n).padStart(2, '0');

type Options = InvitationProps & {
  // Efectos visuales propios del tema al confirmar (confeti, animaciones…)
  onConfirmed?: (attending: boolean) => void;
};

export function useInvitation({ event, invite, urls, reset, onConfirmed }: Options) {
  const maxGuests = invite?.maxGuests ?? event.max_guests;
  const deadlineMs = event.rsvp_deadline ? new Date(event.rsvp_deadline).getTime() : null;

  const [mounted, setMounted] = useState(false);
  const [stored, setStored] = useState<Stored | null>(null);
  const [view, setView] = useState<'form' | 'done' | 'closed'>('form');
  const [fresh, setFresh] = useState(false);
  const [name, setName] = useState(invite?.label ?? '');
  const [attending, setAttending] = useState<boolean | null>(null);
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: boolean; attending?: boolean }>({});
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState('');
  const [bump, setBump] = useState(0);
  const [plat, setPlat] = useState<{ platform: Platform; inApp: boolean }>({ platform: 'other', inApp: false });
  const [now, setNow] = useState<number | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // Montaje: respuesta guardada, plataforma y ?reset=1 (solo existen en el navegador)
  useEffect(() => {
    if (reset) {
      try {
        localStorage.removeItem(storeKey(event.id));
      } catch {}
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState(null, '', url);
    }
    const prev = reset ? null : readStore(event.id);
    /* eslint-disable react-hooks/set-state-in-effect -- sincroniza estado que solo existe en el navegador */
    setPlat(detectPlatform());
    setStored(prev);
    if (prev) setView('done');
    else if (deadlineMs && Date.now() > deadlineMs) setView('closed');
    setNow(Date.now());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [event.id, reset, deadlineMs]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ---------- Calendario ----------
  const useApple = (plat.platform === 'ios' || plat.platform === 'mac') && !plat.inApp;

  function markCalSaved() {
    setStored((cur) => {
      if (!cur) return cur;
      const next = { ...cur, cal: true };
      writeStore(event.id, next);
      return next;
    });
  }

  function openCalendar() {
    if (useApple) {
      window.location.href = urls.ics; // abre la hoja nativa "Añadir al calendario"
    } else {
      const w = window.open(urls.google, '_blank');
      if (w) w.opener = null;
      else window.location.href = urls.google;
    }
    setTimeout(markCalSaved, 600);
  }

  const calHint = plat.inApp
    ? 'Se abrirá Google Calendar. Si usas iPhone, abre esta invitación en Safari para usar el calendario del teléfono.'
    : plat.platform === 'ios'
      ? 'Se abrirá el calendario de tu iPhone: solo toca «Añadir».'
      : plat.platform === 'mac'
        ? 'Se abrirá el Calendario de tu Mac: solo toca «Añadir».'
        : 'Se abrirá Google Calendar con todo listo: solo toca «Guardar».';

  // ---------- Formulario ----------
  function changeGuests(delta: number) {
    setGuests((g) => Math.max(1, Math.min(maxGuests, g + delta)));
    setBump((b) => b + 1);
  }

  function chooseAttending(value: boolean) {
    setAttending(value);
    setErrors((e) => ({ ...e, attending: false }));
    vibrate(20);
  }

  function changeName(value: string) {
    setName(value);
    if (value.trim()) setErrors((er) => ({ ...er, name: false }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const nextErrors = { name: !name.trim(), attending: attending === null };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.attending) {
      const first = formRef.current?.querySelector(nextErrors.name ? '[data-field="name"]' : '[data-field="attending"]');
      first?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      if (nextErrors.name) nameRef.current?.focus({ preventScroll: true });
      vibrate([40, 40, 40]);
      return;
    }

    const prev = stored;
    const record: Stored = {
      deviceId: prev?.deviceId ?? newDeviceId(),
      name: name.trim().slice(0, 80),
      attending: attending === true,
      guests: attending ? guests : 0,
      message: message.trim().slice(0, 300),
      cal: attending ? prev?.attending && prev.cal : false,
    };

    setSending(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: event.slug,
          code: invite?.code ?? null,
          deviceId: record.deviceId,
          name: record.name,
          attending: record.attending,
          guests: record.guests,
          message: record.message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (record.attending) record.guests = json.guests ?? record.guests;

      writeStore(event.id, record);
      setStored(record);
      setFresh(true);
      setView('done');
      onConfirmed?.(record.attending);
      if (record.attending) {
        vibrate([50, 50, 120]);
        // En iPhone/Mac el calendario se abre solo; en Android basta un toque
        if (!prev?.attending && useApple) setTimeout(openCalendar, 1200);
      }
      requestAnimationFrame(() => {
        doneRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        doneRef.current?.focus({ preventScroll: true });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setFormError(
        msg === 'Las confirmaciones ya cerraron'
          ? 'Las confirmaciones ya cerraron. Escríbenos directamente si aún quieres venir.'
          : navigator.onLine
            ? '¡Ups! No pudimos enviar tu respuesta. Intenta de nuevo en un momento.'
            : 'Parece que no tienes conexión. Revisa tu internet e intenta de nuevo.'
      );
      vibrate([60, 40, 60]);
    } finally {
      setSending(false);
    }
  }

  function changeAnswer() {
    if (stored) {
      setName(stored.name);
      setMessage(stored.message);
      setAttending(stored.attending);
      setGuests(stored.attending ? Math.min(stored.guests, maxGuests) : 1);
    }
    setFresh(false);
    setView('form');
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    );
  }

  // ---------- Cuenta regresiva ----------
  const startMs = new Date(event.starts_at).getTime();
  const endMs = new Date(event.ends_at).getTime();
  const diff = now === null ? null : startMs - now;
  const countdown =
    diff !== null && diff > 0
      ? {
          d: pad(Math.floor(diff / 86400000)),
          h: pad(Math.floor((diff % 86400000) / 3600000)),
          m: pad(Math.floor((diff % 3600000) / 60000)),
          s: pad(Math.floor((diff % 60000) / 1000)),
        }
      : null;
  const phase: 'loading' | 'before' | 'live' | 'over' =
    now === null ? 'loading' : diff! > 0 ? 'before' : now < endMs ? 'live' : 'over';

  const firstName = stored ? (stored.name.length <= 18 ? stored.name : stored.name.split(' ')[0]) : '';

  return {
    mounted,
    view,
    fresh,
    stored,
    firstName,
    deadlinePassed: !!(deadlineMs && now && now > deadlineMs),
    countdown,
    phase,
    changeAnswer,
    // Refs aparte (no dentro de form) para que leer form.* en el render sea válido
    doneRef,
    formRef,
    nameRef,
    form: {
      name,
      setName: changeName,
      attending,
      chooseAttending,
      guests,
      changeGuests,
      maxGuests,
      bump,
      message,
      setMessage,
      errors,
      sending,
      error: formError,
      submit,
    },
    calendar: {
      open: openCalendar,
      markSaved: markCalSaved,
      saved: !!stored?.cal,
      hint: calHint,
    },
  };
}
