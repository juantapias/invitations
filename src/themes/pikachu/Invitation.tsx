'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InvitationProps } from '../shared/types';
import { useInvitation } from '../shared/useInvitation';
import './styles.css';
import { burst, prefersReducedMotion, useBodyLock, useReveal, useStickyCta, vibrate } from '../shared/effects';
import { Icon, IconSprite } from './Icons';

const CONFETTI = ['<svg viewBox="0 0 24 24"><use href="#i-bolt"/></svg>', '<svg viewBox="0 0 24 24"><use href="#i-ball"/></svg>'];
const COLORS = ['#FFCB05', '#E3350D', '#2A75BB', '#FFE066', '#8BD45E'];

export default function PikachuInvitation(props: InvitationProps) {
  const { event, invite, text, urls, skipIntro } = props;

  // ---------- Pikachu ----------
  const pikaRef = useRef<HTMLButtonElement>(null);
  const zapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const zap = useCallback(() => {
    const el = pikaRef.current;
    if (!el) return;
    el.classList.remove('is-zap');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('is-zap');
    clearTimeout(zapTimer.current);
    zapTimer.current = setTimeout(() => el.classList.remove('is-zap'), 1400);
  }, []);

  const confettiRef = useRef<HTMLDivElement>(null);
  const inv = useInvitation({
    ...props,
    onConfirmed: (yes) => {
      if (!yes) return;
      burst(confettiRef.current, CONFETTI, COLORS);
      zap();
    },
  });
  const { mounted, view, fresh, stored, firstName, deadlinePassed, countdown, phase, changeAnswer, doneRef, formRef, nameRef } = inv;
  const { name, setName, attending, chooseAttending, guests, changeGuests, maxGuests, bump, message, setMessage, errors, sending, submit } = inv.form;
  const formError = inv.form.error;
  const { open: openCalendar, markSaved: markCalSaved, saved: calSaved, hint: calHint } = inv.calendar;

  // ---------- Intro: Pokébola ----------
  const [intro, setIntro] = useState<'closed' | 'shaking' | 'opening' | 'gone' | 'removed'>(skipIntro ? 'removed' : 'closed');
  useBodyLock(intro !== 'removed' && intro !== 'gone');

  const openIntro = useCallback(() => {
    if (intro !== 'closed') return;
    vibrate([30, 60, 30]);
    const finish = () => {
      setIntro('gone');
      setTimeout(() => setIntro('removed'), 700);
      setTimeout(zap, 350);
    };
    if (prefersReducedMotion()) return finish();
    setIntro('shaking');
    setTimeout(() => {
      setIntro('opening');
      vibrate(80);
    }, 1350);
    setTimeout(finish, 2000);
  }, [intro, zap]);

  useEffect(() => {
    if (intro !== 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') openIntro();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [intro, openIntro]);

  useEffect(() => {
    if (!skipIntro) return;
    const t = setTimeout(zap, 350);
    return () => clearTimeout(t);
  }, [skipIntro, zap]);

  // ---------- Scroll ----------
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);
  useReveal(rootRef);
  const stickyVisible = useStickyCta(heroRef, rsvpRef);

  const countdownDone = phase === 'live' ? '¡Es hoy! ¡La fiesta ya comenzó! ⚡' : phase === 'over' ? '¡Gracias por ser parte de la aventura!' : null;
  const nameLen = event.honoree.length;
  const nameClass = `hero__name${nameLen > 12 ? ' is-xlong' : nameLen > 8 ? ' is-long' : ''}`;
  const heroCta = !mounted ? 'Confirmar asistencia' : stored ? 'Ver mi respuesta' : view === 'closed' ? 'Ver detalles' : 'Confirmar asistencia';

  return (
    <div ref={rootRef} className="theme-pikachu">
      <IconSprite />

      {intro !== 'removed' && (
        <div
          className={`intro${intro === 'shaking' ? ' is-shaking' : ''}${intro === 'opening' || intro === 'gone' ? ' is-opening' : ''}${intro === 'gone' ? ' is-gone' : ''}`}
          onClick={(e) => e.target === e.currentTarget && openIntro()}
        >
          <div className="intro__rays" aria-hidden="true" />
          {invite && <p className="intro__to">Para: {invite.label}</p>}
          <button className="intro__btn" type="button" aria-label="Abrir la invitación" onClick={openIntro}>
            <span className="ball" aria-hidden="true">
              <span className="ball__top" />
              <span className="ball__bottom" />
              <span className="ball__band" />
              <span className="ball__core"><span /></span>
            </span>
          </button>
          <p className="intro__hint">Toca la Pokébola <span aria-hidden="true">⚡</span></p>
          <div className="intro__flash" aria-hidden="true" />
        </div>
      )}

      <div className="app">
        {/* ===== HERO ===== */}
        <header className="hero" id="inicio" ref={heroRef}>
          <div className="hero__sky" aria-hidden="true">
            <span className="cloud cloud--1" />
            <span className="cloud cloud--2" />
            <span className="cloud cloud--3" />
            <Icon id="bolt" className="spark spark--1" />
            <Icon id="bolt" className="spark spark--2" />
            <Icon id="bolt" className="spark spark--3" />
            <Icon id="bolt" className="spark spark--4" />
          </div>

          <div className="hero__text">
            {invite && <p className="hero__hello">¡Hola, {invite.label}!</p>}
            <p className="hero__kicker">{event.phrase}</p>
            <h1 className="hero__title">
              <span className={nameClass}>{event.honoree}</span>
              {event.age != null && (
                <span className="hero__age">
                  cumple <span className="hero__num">{event.age}</span> {event.age === 1 ? 'año' : 'años'}
                </span>
              )}
            </h1>
          </div>

          <button
            className="pika"
            type="button"
            aria-label="Pikachu. Tócalo"
            ref={pikaRef}
            onClick={() => {
              zap();
              vibrate(40);
            }}
          >
            <span className="pika__bubble" aria-hidden="true">¡Pika pika!</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG vectorial, no necesita optimización */}
            <img className="pika__img" src="/themes/pikachu/pikachu.svg" alt="" width={91} height={109} decoding="async" fetchPriority="high" draggable={false} />
            <span className="pika__glow pika__glow--l" aria-hidden="true" />
            <span className="pika__glow pika__glow--r" aria-hidden="true" />
            <svg className="pika__zap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <g fill="#FFF36B" stroke="#F2AE00" strokeWidth=".8" strokeLinejoin="round">
                <path d="M38 52l-14-5 8 7-11 2 18 5z" />
                <path d="M37 60l-16 5 11 1-6 8 15-10z" />
                <path d="M88 50l12-6-6 8 8 1-14 5z" />
                <path d="M88 59l12 4-9 2 6 7-12-9z" />
              </g>
            </svg>
            <span className="pika__shadow" aria-hidden="true" />
          </button>

          <div className="hero__cta">
            {event.message && <p className="hero__lead">{event.message}</p>}
            <a className="btn btn--primary" href="#rsvp">
              <Icon id="bolt" className="btn__icon" />
              <span>{heroCta}</span>
            </a>
          </div>

          <a className="hero__scroll" href="#cuenta">
            <span className="hero__mouse" aria-hidden="true"><span /></span>
            <span className="hero__scroll-lbl">
              Desliza para ver más{' '}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </a>

          <svg className="hero__hills" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 34C60 8 110 8 170 26s120 26 230-8V60H0z" fill="#8BD45E" />
            <path d="M0 46c70-22 140-22 210-4s130 16 190-4V60H0z" fill="#FFCB05" />
          </svg>
        </header>

        <main className="content">
          {/* ===== CUENTA REGRESIVA ===== */}
          <section className="section" id="cuenta" aria-labelledby="t-cuenta">
            <div className="dex reveal">
              <div className="dex__top" aria-hidden="true">
                <span className="dex__lens" />
                <span className="dex__led dex__led--r" />
                <span className="dex__led dex__led--y" />
                <span className="dex__led dex__led--g" />
              </div>
              <h2 className="dex__title" id="t-cuenta">¡La aventura comienza en!</h2>
              <div className="dex__screen">
                {countdownDone ? (
                  <p className="countdown__done">{countdownDone}</p>
                ) : (
                  <div className="countdown" role="timer" aria-live="off">
                    {(['d', 'h', 'm', 's'] as const).map((k) => (
                      <div className="countdown__cell" key={k}>
                        <span className="countdown__num">{countdown ? countdown[k] : '--'}</span>
                        <span className="countdown__lbl">{{ d: 'Días', h: 'Horas', m: 'Min', s: 'Seg' }[k]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== DETALLES ===== */}
          <section className="section" id="detalles" aria-labelledby="t-detalles">
            <h2 className="sec-title reveal" id="t-detalles"><Icon id="ball" className="sec-title__ball" />Detalles</h2>
            <ul className="card details reveal">
              <li className="details__row">
                <span className="details__icon"><Icon id="cal" /></span>
                <div><span className="details__lbl">Fecha</span><strong className="details__val">{text.date}</strong></div>
              </li>
              <li className="details__row">
                <span className="details__icon"><Icon id="clock" /></span>
                <div>
                  <span className="details__lbl">Hora</span>
                  <strong className="details__val">{text.time}</strong>
                  {event.time_note && (
                    <span className="details__note"><Icon id="alarm" /><span>{event.time_note}</span></span>
                  )}
                </div>
              </li>
              <li className="details__row">
                <span className="details__icon"><Icon id="pin" /></span>
                <div>
                  <span className="details__lbl">Lugar</span>
                  <strong className="details__val">{event.venue_name}</strong>
                  {event.venue_address && <span className="details__sub">{event.venue_address}</span>}
                </div>
              </li>
              {event.dress_code && (
                <li className="details__row">
                  <span className="details__icon"><Icon id="shirt" /></span>
                  <div><span className="details__lbl">Vestimenta</span><strong className="details__val">{event.dress_code}</strong></div>
                </li>
              )}
              {text.deadline && (
                <li className="details__row">
                  <span className="details__icon"><Icon id="alarm" /></span>
                  <div><span className="details__lbl">Confirma antes del</span><strong className="details__val">{text.deadline}</strong></div>
                </li>
              )}
            </ul>
          </section>

          {/* ===== UBICACIÓN ===== */}
          <section className="section" id="ubicacion" aria-labelledby="t-ubicacion">
            <h2 className="sec-title reveal" id="t-ubicacion"><Icon id="ball" className="sec-title__ball" />Ubicación</h2>
            <div className="card card--flush reveal">
              <div className="map">
                <iframe title="Mapa de la ubicación del evento" src={urls.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                <div className="map__skeleton" aria-hidden="true"><Icon id="pin" /></div>
              </div>
              <div className="map__info">
                <strong>{event.venue_name}</strong>
                {event.venue_address && <span>{event.venue_address}</span>}
              </div>
              <div className="map__actions">
                <a className="btn btn--blue" href={urls.maps} target="_blank" rel="noopener noreferrer">
                  <Icon id="nav" className="btn__icon" /><span>Google Maps</span>
                </a>
                <a className="btn btn--ghost" href={urls.waze} target="_blank" rel="noopener noreferrer">
                  <Icon id="nav" className="btn__icon" /><span>Waze</span>
                </a>
              </div>
            </div>
          </section>

          {/* ===== RSVP ===== */}
          <section className="section" id="rsvp" aria-labelledby="t-rsvp" ref={rsvpRef}>
            <h2 className="sec-title reveal" id="t-rsvp"><Icon id="ball" className="sec-title__ball" />¿Aceptas el reto?</h2>

            <div className="card rsvp reveal">
              {view === 'form' && (
                <form className="form" noValidate onSubmit={submit} ref={formRef}>
                  <p className="form__intro">Confirma tu asistencia para que tengamos listo tu lugar en el equipo. <span aria-hidden="true">⚡</span></p>

                  <div className={`field${errors.name ? ' is-invalid' : ''}`} data-field="name">
                    <label className="field__lbl" htmlFor="fNombre">Nombre o familia</label>
                    <input
                      ref={nameRef}
                      className="field__input"
                      id="fNombre"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      maxLength={80}
                      enterKeyHint="next"
                      placeholder="Tu nombre o el de tu familia"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    {errors.name && <p className="field__err">Escribe tu nombre, entrenador.</p>}
                  </div>

                  <fieldset className={`field choice${errors.attending ? ' is-invalid' : ''}`} data-field="attending">
                    <legend className="field__lbl">¿Asistirás?</legend>
                    <div className="choice__grid">
                      <label className="choice__opt choice__opt--yes">
                        <input type="radio" name="asiste" checked={attending === true} onChange={() => chooseAttending(true)} />
                        <span className="choice__card"><Icon id="bolt" className="choice__ico" /><span className="choice__txt">¡Sí, ahí estaré!</span></span>
                      </label>
                      <label className="choice__opt choice__opt--no">
                        <input type="radio" name="asiste" checked={attending === false} onChange={() => chooseAttending(false)} />
                        <span className="choice__card"><Icon id="ball" className="choice__ico" /><span className="choice__txt">No podré ir</span></span>
                      </label>
                    </div>
                    {errors.attending && <p className="field__err">Elige una opción.</p>}
                  </fieldset>

                  {attending && (
                    <div className="field people">
                      <span className="field__lbl" id="lblPersonas">¿Cuántas personas asistirán? <small>(contándote)</small></span>
                      <div className="stepper" role="group" aria-labelledby="lblPersonas">
                        <button className="stepper__btn" type="button" aria-label="Quitar una persona" disabled={guests <= 1} onClick={() => changeGuests(-1)}>−</button>
                        <output key={bump} className={`stepper__val${bump ? ' is-bump' : ''}`} aria-live="polite">{guests}</output>
                        <button className="stepper__btn" type="button" aria-label="Agregar una persona" disabled={guests >= maxGuests} onClick={() => changeGuests(1)}>+</button>
                      </div>
                      <p className="field__hint">{maxGuests === 1 ? 'Esta invitación es para 1 persona.' : `Esta invitación es para máximo ${maxGuests} personas.`}</p>
                    </div>
                  )}

                  <div className="field">
                    <label className="field__lbl" htmlFor="fMensaje">Mensaje para {event.honoree} <small>(opcional)</small></label>
                    <textarea
                      className="field__input field__input--area"
                      id="fMensaje"
                      rows={3}
                      maxLength={300}
                      enterKeyHint="done"
                      placeholder={`¡Feliz cumpleaños, ${event.honoree}!`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <button className={`btn btn--primary btn--block btn--lg${sending ? ' is-loading' : ''}`} type="submit" disabled={sending}>
                    <span className="btn__spinner" aria-hidden="true" />
                    <span className="btn__label">{sending ? 'Enviando…' : 'Enviar respuesta'}</span>
                  </button>
                  {attending && (
                    <p className="form__note"><Icon id="cal" /><span>Después de confirmar podrás guardarlo en tu calendario con un toque.</span></p>
                  )}
                  {formError && <p className="form__error" role="alert">{formError}</p>}
                </form>
              )}

              {view === 'done' && stored && (
                <div className="done" tabIndex={-1} ref={doneRef}>
                  <div className={`done__badge${stored.attending ? '' : ' is-no'}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24"><use href={stored.attending ? '#i-bolt' : '#i-ball'} /></svg>
                  </div>
                  {stored.attending ? (
                    <>
                      <h3 className="done__title">{fresh ? `¡Genial, ${firstName}!` : `¡Ya estás en el equipo, ${firstName}!`}</h3>
                      <p className="done__text">
                        Confirmaste <strong>{stored.guests === 1 ? '1 persona' : `${stored.guests} personas`}</strong>. ¡Te esperamos el{' '}
                        <strong>{text.date.charAt(0).toLowerCase() + text.date.slice(1)}</strong> a las <strong>{text.startTime}</strong>!
                      </p>
                      <div className="done__cal">
                        {!calSaved && (
                          <p className="done__step"><Icon id="cal" /> Último paso: guárdalo en tu calendario</p>
                        )}
                        <button className={`btn btn--primary btn--block btn--lg${calSaved ? ' is-saved' : ' btn--pulse'}`} type="button" onClick={openCalendar}>
                          <Icon id="cal" className="btn__icon" />
                          <span>{calSaved ? '¡Listo! Abrir de nuevo' : 'Guardar en mi calendario'}</span>
                        </button>
                        <p className="done__hint">
                          {calSaved ? '¿No se guardó? Toca el botón otra vez o prueba con otro calendario abajo.' : calHint}
                        </p>
                        <details className="done__more">
                          <summary>¿Usas otro calendario?</summary>
                          <div className="done__cal-alt">
                            <a className="chip" href={urls.google} target="_blank" rel="noopener noreferrer" onClick={markCalSaved}>Google Calendar</a>
                            <a className="chip" href={urls.ics} onClick={markCalSaved}>Apple / Outlook</a>
                          </div>
                        </details>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="done__title">{fresh ? '¡Gracias por avisarnos!' : 'Tu respuesta está registrada'}</h3>
                      <p className="done__text">Te vamos a extrañar, {firstName}. Si cambias de opinión, puedes actualizar tu respuesta aquí.</p>
                    </>
                  )}
                  {!deadlinePassed && (
                    <button className="link-btn" type="button" onClick={changeAnswer}>Cambiar mi respuesta</button>
                  )}
                </div>
              )}

              {view === 'closed' && (
                <div className="closed">
                  <h3 className="done__title">Las confirmaciones cerraron</h3>
                  <p className="done__text">Si aún quieres venir, escríbenos directamente.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="footer">
          {urls.whatsapp && (
            <a className="btn btn--ghost btn--sm" href={urls.whatsapp} target="_blank" rel="noopener noreferrer">
              <Icon id="chat" className="btn__icon" /><span>¿Dudas? Escríbenos</span>
            </a>
          )}
          <p className="footer__txt">Hecho con <Icon id="bolt" className="footer__bolt" /> para {event.honoree}</p>
          <p className="footer__legal">Fan art sin fines comerciales. Pokémon y Pikachu son marcas de Nintendo / Game Freak / The Pokémon Company.</p>
          <a className="footer__sign" href="https://juantapias.dev" target="_blank" rel="noopener">By <strong>Tapias</strong></a>
        </footer>
      </div>

      <div className={`sticky-cta${stickyVisible && mounted && !stored && view === 'form' ? ' is-visible' : ''}`} aria-hidden={!(stickyVisible && !stored)}>
        <a className="btn btn--primary btn--block" href="#rsvp" tabIndex={stickyVisible && !stored ? 0 : -1}>
          <Icon id="bolt" className="btn__icon" /><span>Confirmar asistencia</span>
        </a>
      </div>

      <div className="confetti" ref={confettiRef} aria-hidden="true" />
    </div>
  );
}
