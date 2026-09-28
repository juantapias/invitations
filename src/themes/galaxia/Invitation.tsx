'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import localFont from 'next/font/local';
import type { InvitationProps } from '../shared/types';
import { useInvitation } from '../shared/useInvitation';
import './styles.css';
import { burst, prefersReducedMotion, useBodyLock, useReveal, useStickyCta, vibrate } from '../shared/effects';

// Fredoka guardada en el proyecto (latín, peso variable 500–700). No se usa next/font/google porque
// para fuentes con varios ejes Google a veces responde con URLs /l/font?kit=… que Turbopack no puede procesar.
const fredoka = localFont({
  src: './fonts/fredoka-latin-wght.woff2',
  weight: '500 700',
  variable: '--font-fredoka',
  display: 'swap',
});

const STAR = '<svg viewBox="0 0 24 24"><path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z" fill="currentColor"/></svg>';
const PLANET = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/><ellipse cx="12" cy="12" rx="11" ry="3.2" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(-20 12 12)"/></svg>';
const COLORS = ['#7CF3FF', '#FF6FD8', '#FFD166', '#B79CFF', '#FFFFFF'];

function Rocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 200" aria-hidden="true">
      <g className="rk-flame">
        <path d="M44 150c0 22 8 36 16 46 8-10 16-24 16-46z" fill="#FF8A3D" />
        <path d="M51 150c0 15 4 25 9 32 5-7 9-17 9-32z" fill="#FFD166" />
      </g>
      <path d="M30 118 8 150l30-6z" fill="#FF4F7B" stroke="#1B1F5E" strokeWidth="4" strokeLinejoin="round" />
      <path d="M90 118l22 32-30-6z" fill="#FF4F7B" stroke="#1B1F5E" strokeWidth="4" strokeLinejoin="round" />
      <path d="M60 6C34 28 26 70 30 120c2 18 8 30 12 34h36c4-4 10-16 12-34C94 70 86 28 60 6z" fill="#F4F6FF" stroke="#1B1F5E" strokeWidth="4" strokeLinejoin="round" />
      <path d="M60 6C49 15 41 29 36 44h48C79 29 71 15 60 6z" fill="#FF4F7B" stroke="#1B1F5E" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="60" cy="78" r="17" fill="#7CF3FF" stroke="#1B1F5E" strokeWidth="4" />
      <path d="M52 71a10 10 0 0 1 10-5" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M52 154v-14h16v14" fill="#B79CFF" stroke="#1B1F5E" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 118h40" stroke="#D5DAF0" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const Ico = {
  cal: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>,
  clock: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>,
  pin: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.6" fill="currentColor" /></svg>,
  alarm: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>,
  shirt: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>,
  nav: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>,
  rocket: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c-3 2.5-4.5 7-4 12h8c.5-5-1-9.5-4-12z" fill="currentColor" /><path d="M8 14l-3 4 4-1M16 14l3 4-4-1M10.5 17h3l-1.5 4z" fill="currentColor" /></svg>,
  planet: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor" /><ellipse cx="12" cy="12" rx="11" ry="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-20 12 12)" /></svg>,
  chat: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /></svg>,
};

export default function GalaxiaInvitation(props: InvitationProps) {
  const { event, invite, text, urls, skipIntro } = props;
  const confettiRef = useRef<HTMLDivElement>(null);
  const inv = useInvitation({
    ...props,
    onConfirmed: (yes) => yes && burst(confettiRef.current, [STAR, PLANET], COLORS),
  });
  const { mounted, view, fresh, stored, firstName, deadlinePassed, countdown, phase, changeAnswer, doneRef, formRef, nameRef, form, calendar } = inv;

  // ---------- Intro: 3, 2, 1… ¡despegue! ----------
  const [intro, setIntro] = useState<'idle' | 'count' | 'launch' | 'gone' | 'removed'>(skipIntro ? 'removed' : 'idle');
  const [count, setCount] = useState(3);
  useBodyLock(intro !== 'removed' && intro !== 'gone');

  const launch = useCallback(() => {
    if (intro !== 'idle') return;
    vibrate(30);
    const finish = () => {
      setIntro('gone');
      setTimeout(() => setIntro('removed'), 700);
    };
    if (prefersReducedMotion()) return finish();
    setIntro('count');
    setCount(3);
    setTimeout(() => { setCount(2); vibrate(20); }, 450);
    setTimeout(() => { setCount(1); vibrate(20); }, 900);
    setTimeout(() => { setIntro('launch'); vibrate([60, 40, 120]); }, 1350);
    setTimeout(finish, 2300);
  }, [intro]);

  useEffect(() => {
    if (intro !== 'idle') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') launch();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [intro, launch]);

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);
  useReveal(rootRef);
  const stickyVisible = useStickyCta(heroRef, rsvpRef);

  const heroCta = !mounted ? 'Confirmar asistencia' : stored ? 'Ver mi respuesta' : view === 'closed' ? 'Ver detalles' : 'Confirmar asistencia';
  const nameLen = event.honoree.length;

  return (
    <div ref={rootRef} className={`theme-galaxia ${fredoka.variable}`}>
      {intro !== 'removed' && (
        <div className={`gx-intro is-${intro}`}>
          <div className="gx-stars" aria-hidden="true" />
          {invite && <p className="gx-intro__to">Tripulante: {invite.label}</p>}
          <button className="gx-intro__btn" type="button" onClick={launch} aria-label="Despegar y abrir la invitación">
            <Rocket className="gx-intro__rocket" />
          </button>
          <p className={`gx-intro__hint${intro === 'count' ? ' is-count' : ''}`} aria-live="polite">
            {intro === 'idle' ? 'Toca el cohete para despegar' : intro === 'count' ? <span className="gx-intro__count" key={count}>{count}</span> : '¡Despegue!'}
          </p>
          <div className="gx-intro__flash" aria-hidden="true" />
        </div>
      )}

      <div className="gx-app">
        <div className="gx-stars gx-stars--fixed" aria-hidden="true" />

        {/* ===== PORTADA ===== */}
        <header className="gx-hero" ref={heroRef}>
          <div className="gx-hero__planet" aria-hidden="true" />
          <div className="gx-hero__moon" aria-hidden="true" />

          <div className="gx-hero__text">
            {invite && <p className="gx-hello">¡Hola, {invite.label}!</p>}
            <p className="gx-kicker">{event.phrase}</p>
            <h1 className="gx-title">
              <span className={`gx-name${nameLen > 12 ? ' is-xlong' : nameLen > 8 ? ' is-long' : ''}`}>{event.honoree}</span>
              {event.age != null && (
                <span className="gx-age">
                  cumple <span className="gx-age__num"><b>{event.age}</b></span> {event.age === 1 ? 'año' : 'años'}
                </span>
              )}
            </h1>
          </div>

          <div className="gx-hero__rocket" aria-hidden="true">
            <Rocket />
          </div>

          <div className="gx-hero__cta">
            {event.message && <p className="gx-lead">{event.message}</p>}
            <a className="gx-btn gx-btn--primary" href="#rsvp">{Ico.rocket}<span>{heroCta}</span></a>
          </div>

          <a className="gx-scroll" href="#cuenta">
            Desliza para ver más
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
        </header>

        <main className="gx-content">
          {/* ===== CONTROL DE MISIÓN ===== */}
          <section id="cuenta" className="gx-section" aria-labelledby="gx-t-cuenta">
            <div className="gx-card gx-mission reveal">
              <p className="gx-mission__tag">Control de misión</p>
              <h2 className="gx-h2" id="gx-t-cuenta">Despegamos en</h2>
              {phase === 'live' || phase === 'over' ? (
                <p className="gx-mission__done">{phase === 'live' ? '¡La misión ya comenzó! 🚀' : '¡Gracias por ser parte de la tripulación!'}</p>
              ) : (
                <div className="gx-countdown" role="timer" aria-live="off">
                  {(['d', 'h', 'm', 's'] as const).map((k) => (
                    <div className="gx-countdown__cell" key={k}>
                      <b>{countdown ? countdown[k] : '--'}</b>
                      <span>{{ d: 'Días', h: 'Horas', m: 'Min', s: 'Seg' }[k]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ===== BITÁCORA ===== */}
          <section className="gx-section" aria-labelledby="gx-t-detalles">
            <h2 className="gx-h2 reveal" id="gx-t-detalles">Bitácora de la misión</h2>
            <ul className="gx-card gx-log reveal">
              <li><span className="gx-log__ico">{Ico.cal}</span><div><small>Fecha</small><strong>{text.date}</strong></div></li>
              <li>
                <span className="gx-log__ico">{Ico.clock}</span>
                <div>
                  <small>Hora</small>
                  <strong>{text.time}</strong>
                  {event.time_note && <span className="gx-note">{Ico.alarm}{event.time_note}</span>}
                </div>
              </li>
              <li>
                <span className="gx-log__ico">{Ico.pin}</span>
                <div><small>Lugar</small><strong>{event.venue_name}</strong>{event.venue_address && <span className="gx-sub">{event.venue_address}</span>}</div>
              </li>
              {event.dress_code && (
                <li><span className="gx-log__ico">{Ico.shirt}</span><div><small>Vestimenta</small><strong>{event.dress_code}</strong></div></li>
              )}
              {text.deadline && (
                <li><span className="gx-log__ico">{Ico.alarm}</span><div><small>Confirma antes del</small><strong>{text.deadline}</strong></div></li>
              )}
            </ul>
          </section>

          {/* ===== COORDENADAS ===== */}
          <section className="gx-section" aria-labelledby="gx-t-mapa">
            <h2 className="gx-h2 reveal" id="gx-t-mapa">Coordenadas de aterrizaje</h2>
            <div className="gx-card gx-card--flush reveal">
              <div className="gx-map">
                <iframe title="Mapa de la ubicación del evento" src={urls.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </div>
              <div className="gx-map__info"><strong>{event.venue_name}</strong>{event.venue_address && <span>{event.venue_address}</span>}</div>
              <div className="gx-map__actions">
                <a className="gx-btn gx-btn--primary" href={urls.maps} target="_blank" rel="noopener noreferrer">{Ico.nav}<span>Google Maps</span></a>
                <a className="gx-btn" href={urls.waze} target="_blank" rel="noopener noreferrer">{Ico.nav}<span>Waze</span></a>
              </div>
            </div>
          </section>

          {/* ===== TRIPULACIÓN (RSVP) ===== */}
          <section id="rsvp" className="gx-section" aria-labelledby="gx-t-rsvp" ref={rsvpRef}>
            <h2 className="gx-h2 reveal" id="gx-t-rsvp">¿Te unes a la tripulación?</h2>
            <div className="gx-card gx-rsvp reveal">
              {view === 'form' && (
                <form className="gx-form" noValidate onSubmit={form.submit} ref={formRef}>
                  <div className={`gx-field${form.errors.name ? ' is-invalid' : ''}`} data-field="name">
                    <label htmlFor="gx-nombre">Nombre o familia</label>
                    <input
                      ref={nameRef}
                      id="gx-nombre"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      maxLength={80}
                      enterKeyHint="next"
                      placeholder="Tu nombre o el de tu familia"
                      value={form.name}
                      onChange={(e) => form.setName(e.target.value)}
                    />
                    {form.errors.name && <p className="gx-err">Escribe tu nombre, astronauta.</p>}
                  </div>

                  <fieldset className={`gx-field gx-choice${form.errors.attending ? ' is-invalid' : ''}`} data-field="attending">
                    <legend>¿Asistirás?</legend>
                    <div className="gx-choice__grid">
                      <label className="gx-choice__opt gx-choice__opt--yes">
                        <input type="radio" name="gx-asiste" checked={form.attending === true} onChange={() => form.chooseAttending(true)} />
                        <span>{Ico.rocket}¡A bordo!</span>
                      </label>
                      <label className="gx-choice__opt gx-choice__opt--no">
                        <input type="radio" name="gx-asiste" checked={form.attending === false} onChange={() => form.chooseAttending(false)} />
                        <span>{Ico.planet}Esta vez no</span>
                      </label>
                    </div>
                    {form.errors.attending && <p className="gx-err">Elige una opción.</p>}
                  </fieldset>

                  {form.attending && (
                    <div className="gx-field gx-crew">
                      <span id="gx-lbl-crew">Tripulantes que asistirán <small>(contándote)</small></span>
                      <div className="gx-stepper" role="group" aria-labelledby="gx-lbl-crew">
                        <button type="button" aria-label="Quitar una persona" disabled={form.guests <= 1} onClick={() => form.changeGuests(-1)}>−</button>
                        <output key={form.bump} className={form.bump ? 'is-bump' : ''} aria-live="polite">{form.guests}</output>
                        <button type="button" aria-label="Agregar una persona" disabled={form.guests >= form.maxGuests} onClick={() => form.changeGuests(1)}>+</button>
                      </div>
                      <small>{form.maxGuests === 1 ? 'Esta invitación es para 1 persona.' : `Esta invitación es para máximo ${form.maxGuests} personas.`}</small>
                    </div>
                  )}

                  <div className="gx-field">
                    <label htmlFor="gx-mensaje">Mensaje para {event.honoree} <small>(opcional)</small></label>
                    <textarea id="gx-mensaje" rows={3} maxLength={300} placeholder={`¡Feliz cumpleaños, ${event.honoree}!`} value={form.message} onChange={(e) => form.setMessage(e.target.value)} />
                  </div>

                  <button className={`gx-btn gx-btn--primary gx-btn--block${form.sending ? ' is-loading' : ''}`} type="submit" disabled={form.sending}>
                    <span className="gx-spinner" aria-hidden="true" />
                    <span>{form.sending ? 'Enviando…' : 'Enviar respuesta'}</span>
                  </button>
                  {form.error && <p className="gx-form-error" role="alert">{form.error}</p>}
                </form>
              )}

              {view === 'done' && stored && (
                <div className="gx-done" tabIndex={-1} ref={doneRef}>
                  <div className={`gx-done__badge${stored.attending ? '' : ' is-no'}`} aria-hidden="true">{stored.attending ? Ico.rocket : Ico.planet}</div>
                  {stored.attending ? (
                    <>
                      <h3>{fresh ? `¡Bienvenido a bordo, ${firstName}!` : `¡Ya eres parte de la tripulación, ${firstName}!`}</h3>
                      <p>
                        Confirmaste <strong>{stored.guests === 1 ? '1 tripulante' : `${stored.guests} tripulantes`}</strong>. Despegamos el{' '}
                        <strong>{text.date.charAt(0).toLowerCase() + text.date.slice(1)}</strong> a las <strong>{text.startTime}</strong>.
                      </p>
                      <div className="gx-cal">
                        {!calendar.saved && <p className="gx-cal__step">{Ico.cal} Último paso: guárdalo en tu calendario</p>}
                        <button className={`gx-btn gx-btn--primary gx-btn--block${calendar.saved ? ' is-saved' : ' is-pulse'}`} type="button" onClick={calendar.open}>
                          {Ico.cal}<span>{calendar.saved ? '¡Listo! Abrir de nuevo' : 'Guardar en mi calendario'}</span>
                        </button>
                        <p className="gx-cal__hint">{calendar.saved ? '¿No se guardó? Toca el botón otra vez o usa otra opción.' : calendar.hint}</p>
                        <details className="gx-cal__more">
                          <summary>¿Usas otro calendario?</summary>
                          <div>
                            <a className="gx-chip" href={urls.google} target="_blank" rel="noopener noreferrer" onClick={calendar.markSaved}>Google Calendar</a>
                            <a className="gx-chip" href={urls.ics} onClick={calendar.markSaved}>Apple / Outlook</a>
                          </div>
                        </details>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{fresh ? '¡Gracias por avisarnos!' : 'Tu respuesta está registrada'}</h3>
                      <p>Te vamos a extrañar en esta misión, {firstName}. Si cambias de opinión, puedes actualizar tu respuesta.</p>
                    </>
                  )}
                  {!deadlinePassed && <button className="gx-link" type="button" onClick={changeAnswer}>Cambiar mi respuesta</button>}
                </div>
              )}

              {view === 'closed' && (
                <div className="gx-done">
                  <h3>Las confirmaciones cerraron</h3>
                  <p>Si aún quieres venir, escríbenos directamente.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="gx-footer">
          {urls.whatsapp && <a className="gx-btn gx-btn--sm" href={urls.whatsapp} target="_blank" rel="noopener noreferrer">{Ico.chat}<span>¿Dudas? Escríbenos</span></a>}
          <p>Hecho con 🚀 para {event.honoree}</p>
          <a className="gx-sign" href="https://juantapias.dev" target="_blank" rel="noopener">By <strong>Tapias</strong></a>
        </footer>
      </div>

      <div className={`gx-sticky${stickyVisible && mounted && !stored && view === 'form' ? ' is-visible' : ''}`} aria-hidden={!(stickyVisible && !stored)}>
        <a className="gx-btn gx-btn--primary gx-btn--block" href="#rsvp" tabIndex={stickyVisible && !stored ? 0 : -1}>{Ico.rocket}<span>Confirmar asistencia</span></a>
      </div>
      <div className="gx-confetti" ref={confettiRef} aria-hidden="true" />
    </div>
  );
}
