'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { saveEvent, type FormState } from '@/app/panel/actions';
import { TIMEZONES, utcToZoned } from '@/lib/dates';
import type { EventRow } from '@/lib/types';
import { DEFAULT_THEME, THEMES, getThemeMeta } from '@/themes/registry';
import ClientCredentials from './ClientCredentials';
import { toSlug } from '@/lib/slug';

function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`pn-field${error ? ' is-invalid' : ''}`} htmlFor={name}>
      <span>{label}</span>
      {children}
      {error ? <small className="pn-field__err">{error}</small> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function EventForm({ event, siteUrl }: { event?: EventRow; siteUrl: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveEvent, {});
  const fe = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Tema y textos: al cambiar de tema, la frase y el mensaje toman los del nuevo tema
  // solo si el organizador no los ha personalizado.
  const [theme, setTheme] = useState(event?.theme ?? DEFAULT_THEME);
  const [phrase, setPhrase] = useState(event?.phrase ?? getThemeMeta(theme).defaults.phrase);
  const [message, setMessage] = useState(event?.message ?? getThemeMeta(theme).defaults.message);
  const [slug, setSlug] = useState(event?.slug ?? '');
  function pickTheme(id: string) {
    const prev = getThemeMeta(theme).defaults;
    const next = getThemeMeta(id).defaults;
    if (!phrase.trim() || phrase === prev.phrase) setPhrase(next.phrase);
    if (!message.trim() || message === prev.message) setMessage(next.message);
    setTheme(id);
  }

  // Lleva al primer campo con error
  useEffect(() => {
    if (!state.error) return;
    const el = formRef.current?.querySelector<HTMLElement>('.is-invalid input, .is-invalid select, .pn-error');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el instanceof HTMLInputElement) el.focus({ preventScroll: true });
  }, [state]);
  const tz = event?.timezone ?? 'America/Bogota';
  const start = event ? utcToZoned(event.starts_at, tz) : null;
  const end = event ? utcToZoned(event.ends_at, tz) : null;
  const deadline = event?.rsvp_deadline ? utcToZoned(event.rsvp_deadline, tz).date : '';

  if (state.credentials) {
    return <ClientCredentials credentials={state.credentials} siteUrl={siteUrl} continueHref={`/${state.credentials.slug}/admin`} />;
  }

  return (
    <form
      ref={formRef}
      className="pn-form"
      noValidate
      onSubmit={(e) => {
        // Envío manual: con action={...} React vacía el formulario aunque haya errores
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {event && <input type="hidden" name="id" value={event.id} />}

      <section className={`pn-card pn-fieldset${fe.theme ? ' is-invalid' : ''}`}>
        <h2 className="pn-legend">Tema de la invitación</h2>
        <div className="pn-themes" role="radiogroup" aria-label="Tema">
          {THEMES.map((t) => (
            <label key={t.id} className={`pn-theme${theme === t.id ? ' is-active' : ''}`}>
              <input type="radio" name="theme" value={t.id} checked={theme === t.id} onChange={() => pickTheme(t.id)} />
              <span className="pn-theme__swatch" aria-hidden="true">
                {t.swatch.map((c) => (
                  <i key={c} style={{ background: c }} />
                ))}
              </span>
              <span className="pn-theme__body">
                <strong>{t.name}</strong>
                <small>{t.description}</small>
                {t.personalUseOnly && <em>Solo uso personal (marca registrada)</em>}
              </span>
            </label>
          ))}
        </div>
        {fe.theme && <small className="pn-field__err">{fe.theme}</small>}
      </section>

      <section className="pn-card pn-fieldset">
        <h2 className="pn-legend">Cliente</h2>
        <p className="pn-muted">Quien compró la invitación. Entrará con este correo a ver sus invitados; no puede editar el evento ni el tema.</p>
        <div className="pn-grid">
          <Field label="Nombre" name="client_name">
            <input id="client_name" name="client_name" maxLength={80} defaultValue={event?.client_name} placeholder="Nombre del cliente" autoCapitalize="words" />
          </Field>
          <Field
            label="Correo"
            name="client_email"
            error={fe.client_email}
            hint={event?.client_email ? 'Si lo cambias, el evento pasa a esa cuenta.' : 'Si no tiene cuenta, se crea con una contraseña que verás al guardar. Vacío = queda a tu nombre.'}
          >
            <input id="client_email" name="client_email" type="email" inputMode="email" autoCapitalize="none" maxLength={254} defaultValue={event?.client_email} placeholder="correo@ejemplo.com" />
          </Field>
        </div>
      </section>

      <section className="pn-card pn-fieldset">
        <h2 className="pn-legend">Cumpleañero</h2>
        <div className="pn-grid">
          <Field label="Nombre" name="honoree" error={fe.honoree}>
            <input id="honoree" name="honoree" required maxLength={40} defaultValue={event?.honoree} placeholder="Nombre del cumpleañero" autoCapitalize="words" />
          </Field>
          <Field label="Edad que cumple" name="age" error={fe.age}>
            <input id="age" name="age" type="number" inputMode="numeric" min={0} max={120} defaultValue={event?.age ?? ''} placeholder="Ej. 5" />
          </Field>
        </div>
        <Field label="Frase destacada" name="phrase">
          <input id="phrase" name="phrase" maxLength={60} value={phrase} onChange={(e) => setPhrase(e.target.value)} />
        </Field>
        <Field label="Mensaje de bienvenida" name="message">
          <textarea
            id="message"
            name="message"
            rows={3}
            maxLength={400}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
      </section>

      <section className="pn-card pn-fieldset">
        <h2 className="pn-legend">Fecha y hora</h2>
        <div className="pn-grid pn-grid--3">
          <Field label="Fecha" name="date" error={fe.date}>
            <input id="date" name="date" type="date" required defaultValue={start?.date} />
          </Field>
          <Field label="Empieza" name="start_time">
            <input id="start_time" name="start_time" type="time" required defaultValue={start?.time ?? '14:00'} />
          </Field>
          <Field label="Termina" name="end_time" error={fe.end_time}>
            <input id="end_time" name="end_time" type="time" required defaultValue={end?.time ?? '19:00'} />
          </Field>
        </div>
        <Field label="Zona horaria" name="timezone" error={fe.timezone}>
          <select id="timezone" name="timezone" defaultValue={tz}>
            {TIMEZONES.map((z) => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Nota bajo la hora" name="time_note" hint="Opcional. Ej. «Nota: por favor, ser puntuales.»">
          <input id="time_note" name="time_note" maxLength={120} defaultValue={event?.time_note ?? ''} />
        </Field>
        <Field label="Confirmar antes del" name="deadline" error={fe.deadline} hint="Opcional. Después de este día el formulario se cierra.">
          <input id="deadline" name="deadline" type="date" defaultValue={deadline} />
        </Field>
      </section>

      <section className="pn-card pn-fieldset">
        <h2 className="pn-legend">Lugar</h2>
        <Field label="Nombre del lugar" name="venue_name" error={fe.venue_name}>
          <input id="venue_name" name="venue_name" required maxLength={120} defaultValue={event?.venue_name} placeholder="Nombre del salón o lugar" />
        </Field>
        <Field label="Dirección" name="venue_address">
          <input id="venue_address" name="venue_address" maxLength={200} defaultValue={event?.venue_address} placeholder="Calle, número y barrio" />
        </Field>
        <Field label="Búsqueda en Google Maps" name="map_query" hint="Incluye la ciudad para que el pin sea exacto. Si lo dejas vacío se usa el nombre y la dirección.">
          <input id="map_query" name="map_query" maxLength={200} defaultValue={event?.map_query} placeholder="Lugar, dirección y ciudad" />
        </Field>
        <div className="pn-grid">
          <Field label="Latitud" name="lat" error={fe.lat} hint="Opcional, lo más preciso">
            <input id="lat" name="lat" inputMode="decimal" defaultValue={event?.lat ?? ''} placeholder="Latitud" />
          </Field>
          <Field label="Longitud" name="lng" error={fe.lng}>
            <input id="lng" name="lng" inputMode="decimal" defaultValue={event?.lng ?? ''} placeholder="Longitud" />
          </Field>
        </div>
      </section>

      <section className="pn-card pn-fieldset">
        <h2 className="pn-legend">Invitados</h2>
        <div className="pn-grid">
          <Field label="Máximo de personas por invitación" name="max_guests" error={fe.max_guests} hint="Los enlaces por familia pueden tener su propio cupo.">
            <input id="max_guests" name="max_guests" type="number" inputMode="numeric" min={1} max={50} defaultValue={event?.max_guests ?? 5} />
          </Field>
          <Field label="WhatsApp de contacto" name="contact_whatsapp" error={fe.contact_whatsapp} hint="Con código de país, ej. 573001234567. Opcional.">
            <input id="contact_whatsapp" name="contact_whatsapp" inputMode="tel" defaultValue={event?.contact_whatsapp} />
          </Field>
        </div>
        <Field label="Código de vestimenta" name="dress_code" hint="Opcional. Déjalo vacío para ocultarlo.">
          <input id="dress_code" name="dress_code" maxLength={160} defaultValue={event?.dress_code} />
        </Field>
        <Field label="Enlace" name="slug" error={fe.slug} hint={event ? 'Cambiarlo rompe los enlaces que ya enviaste.' : 'Opcional. Si lo dejas vacío se usa el nombre del cumpleañero.'}>
          <div className="pn-prefix">
            <span>/</span>
            <input
              id="slug"
              name="slug"
              maxLength={60}
              value={slug}
              onChange={(e) => setSlug(toSlug(e.target.value, { keepTrailingDash: true }))}
              onBlur={() => setSlug((s) => toSlug(s))}
              placeholder="nombre-del-evento"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
            />
          </div>
        </Field>
      </section>

      {state.error && <p className="pn-error" role="alert">{state.error}</p>}
      <div className="pn-sticky-actions">
        <button className="pn-btn pn-btn--primary pn-btn--block" type="submit" disabled={pending}>
          {pending ? 'Guardando…' : event ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  );
}
