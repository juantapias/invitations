(function () {
  'use strict';

  const CFG = window.INVITACION;
  const Cal = window.PikaCalendar;
  const Api = window.PikaApi;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORE_KEY = 'pika-rsvp-v1';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Parámetros del enlace personalizado ----------
  // ?invitado=Familia%20Pérez&cupos=4
  const params = new URLSearchParams(location.search);
  const invitado = (params.get('invitado') || '').trim().slice(0, 80);
  const cuposParam = parseInt(params.get('cupos'), 10);
  const cupos = Number.isFinite(cuposParam) && cuposParam > 0 ? Math.min(cuposParam, 20) : CFG.maxPersonas;

  // ---------- Almacenamiento local ----------
  const store = {
    get() {
      try {
        return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      } catch (_) {
        return null;
      }
    },
    set(v) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(v));
      } catch (_) {}
    },
  };

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------- Formato de fechas ----------
  const tz = CFG.zonaHoraria;
  const fmtFecha = new Intl.DateTimeFormat('es-CO', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' });
  const fmtFechaCorta = new Intl.DateTimeFormat('es-CO', { timeZone: tz, day: 'numeric', month: 'long' });
  const fmtHora = new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
  const inicio = new Date(CFG.inicio);
  const fin = new Date(CFG.fin);
  const limite = CFG.fechaLimite ? new Date(CFG.fechaLimite) : null;

  // ---------- Pintar contenido desde config ----------
  function bind() {
    const values = {
      festejado: CFG.festejado,
      edad: CFG.edad,
      edadLabel: Number(CFG.edad) === 1 ? 'año' : 'años',
      frase: CFG.frase,
      mensaje: CFG.mensaje,
      fecha: fmtFecha.format(inicio),
      hora: `${fmtHora.format(inicio)} – ${fmtHora.format(fin)}`,
      lugarNombre: CFG.lugar.nombre,
      lugarDireccion: CFG.lugar.direccion,
      vestimenta: CFG.vestimenta,
      limite: limite ? fmtFechaCorta.format(limite) : '',
      notaHora: CFG.notaHora || '',
    };
    $$('[data-bind]').forEach((el) => {
      const k = el.dataset.bind;
      if (values[k] != null) el.textContent = values[k];
    });

    if (!CFG.vestimenta) $('#rowVestimenta').hidden = true;
    if (!limite) $('#rowLimite').hidden = true;
    if (!CFG.notaHora) $('#notaHora').hidden = true;

    const name = $('.hero__name');
    const len = String(CFG.festejado).length;
    if (len > 12) name.classList.add('is-xlong');
    else if (len > 8) name.classList.add('is-long');

    document.title = `¡${CFG.festejado} cumple ${CFG.edad}! · ${CFG.frase}`;

    if (invitado) {
      const hello = $('#hello');
      hello.textContent = `¡Hola, ${invitado}!`;
      hello.hidden = false;
      const to = $('#introTo');
      to.textContent = `Para: ${invitado}`;
      to.hidden = false;
      $('#fNombre').value = invitado;
    }

    // Mapa
    const q = Cal.mapsQuery();
    $('#mapFrame').src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=es&output=embed`;
    $('#btnMaps').href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
    const l = CFG.lugar;
    $('#btnWaze').href =
      l.lat != null && l.lng != null
        ? `https://waze.com/ul?ll=${l.lat},${l.lng}&navigate=yes`
        : `https://waze.com/ul?q=${encodeURIComponent(l.busquedaMapa || l.direccion)}&navigate=yes`;

    // WhatsApp
    if (CFG.contacto && CFG.contacto.whatsapp) {
      const w = $('#btnWhats');
      const txt = `Hola, tengo una pregunta sobre el cumpleaños de ${CFG.festejado}.`;
      w.href = `https://wa.me/${CFG.contacto.whatsapp}?text=${encodeURIComponent(txt)}`;
      w.hidden = false;
    }

    // Calendario manual
    $('#btnCalGoogle').href = Cal.googleUrl();
  }

  // ---------- Intro Pokébola ----------
  function intro() {
    const el = $('#intro');
    const btn = $('#introBtn');
    const skip = params.get('intro') === '0';
    let opened = false;

    function finish() {
      el.classList.add('is-gone');
      document.body.classList.remove('is-locked');
      setTimeout(() => el.remove(), 700);
      revealHero();
    }

    if (skip) {
      el.remove();
      document.body.classList.remove('is-locked');
      revealHero();
      return;
    }

    function open() {
      if (opened) return;
      opened = true;
      vibrate([30, 60, 30]);
      if (reduceMotion) return finish();
      el.classList.add('is-shaking');
      setTimeout(() => {
        el.classList.remove('is-shaking');
        el.classList.add('is-opening');
        vibrate(80);
      }, 1350);
      setTimeout(finish, 1350 + 650);
    }

    btn.addEventListener('click', open);
    el.addEventListener('click', (e) => {
      if (e.target === el) open();
    });
    document.addEventListener('keydown', (e) => {
      if (!opened && (e.key === 'Enter' || e.key === ' ')) open();
    });
  }

  function revealHero() {
    const pika = $('#pika');
    setTimeout(() => zap(pika), 350);
  }

  function vibrate(p) {
    try {
      if (navigator.vibrate) navigator.vibrate(p);
    } catch (_) {}
  }

  // ---------- Pikachu interactivo ----------
  let zapTimer;
  function zap(pika) {
    pika.classList.remove('is-zap');
    void pika.offsetWidth; // reinicia animación
    pika.classList.add('is-zap');
    clearTimeout(zapTimer);
    zapTimer = setTimeout(() => pika.classList.remove('is-zap'), 1400);
  }

  function pikachu() {
    const pika = $('#pika');
    pika.addEventListener('click', () => {
      zap(pika);
      vibrate(40);
    });
  }

  // ---------- Cuenta regresiva ----------
  function countdown() {
    const cells = {
      d: $('[data-cd="d"]'),
      h: $('[data-cd="h"]'),
      m: $('[data-cd="m"]'),
      s: $('[data-cd="s"]'),
    };
    const pad = (n) => String(n).padStart(2, '0');
    const done = $('#countdownDone');
    const grid = $('#countdown');
    let timer;

    function tick() {
      const now = Date.now();
      const diff = inicio.getTime() - now;
      if (diff <= 0) {
        grid.hidden = true;
        done.hidden = false;
        done.textContent = now < fin.getTime() ? '¡Es hoy! ¡La fiesta ya comenzó! ⚡' : '¡Gracias por ser parte de la aventura!';
        clearInterval(timer);
        return;
      }
      const s = Math.floor(diff / 1000);
      cells.d.textContent = pad(Math.floor(s / 86400));
      cells.h.textContent = pad(Math.floor((s % 86400) / 3600));
      cells.m.textContent = pad(Math.floor((s % 3600) / 60));
      cells.s.textContent = pad(s % 60);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  // ---------- Reveal + sticky CTA ----------
  function observers() {
    const revealEls = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Barra inferior: visible después del hero y antes del formulario
    const sticky = $('#stickyCta');
    const state = { heroVisible: true, rsvpVisible: false };
    const update = () => {
      const show = !state.heroVisible && !state.rsvpVisible && !store.get();
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      sticky.querySelector('a').tabIndex = show ? 0 : -1;
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.target.id === 'inicio') state.heroVisible = en.isIntersecting;
        if (en.target.id === 'rsvp') state.rsvpVisible = en.isIntersecting;
      });
      update();
    });
    io2.observe($('#inicio'));
    io2.observe($('#rsvp'));
    window.addEventListener('pika:rsvp', update);
  }

  // ---------- Toast / confetti ----------
  let toastTimer;
  function toast(msg, ms = 3200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), ms);
  }

  function confetti() {
    if (reduceMotion) return;
    const box = $('#confetti');
    const colors = ['#FFCB05', '#E3350D', '#2A75BB', '#FFE066', '#8BD45E'];
    const n = window.innerWidth < 400 ? 36 : 54;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      const bolt = Math.random() < 0.55;
      el.innerHTML = bolt
        ? '<svg viewBox="0 0 24 24"><use href="#i-bolt"/></svg>'
        : '<svg viewBox="0 0 24 24"><use href="#i-ball"/></svg>';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.setProperty('--c', colors[i % colors.length]);
      el.style.setProperty('--sz', 14 + Math.random() * 18 + 'px');
      el.style.setProperty('--dur', 2 + Math.random() * 1.6 + 's');
      el.style.setProperty('--delay', Math.random() * 0.5 + 's');
      el.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px');
      el.style.setProperty('--rot', (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360) + 'deg');
      frag.appendChild(el);
    }
    box.appendChild(frag);
    setTimeout(() => (box.innerHTML = ''), 4500);
  }

  // ---------- RSVP ----------
  function rsvp() {
    const form = $('#rsvpForm');
    const done = $('#done');
    const people = $('#peopleField');
    const out = $('#personasOut');
    const [btnMinus, btnPlus] = $$('.stepper__btn');
    const submit = $('#btnSubmit');
    const errBox = $('#formError');
    let personas = 1;

    $('#personasHint').textContent = cupos === 1 ? 'Esta invitación es para 1 persona.' : `Esta invitación es para máximo ${cupos} personas.`;

    function setPersonas(n) {
      personas = Math.max(1, Math.min(cupos, n));
      out.textContent = personas;
      out.classList.remove('is-bump');
      void out.offsetWidth;
      out.classList.add('is-bump');
      btnMinus.disabled = personas <= 1;
      btnPlus.disabled = personas >= cupos;
    }
    setPersonas(1);
    btnMinus.addEventListener('click', () => setPersonas(personas - 1));
    btnPlus.addEventListener('click', () => setPersonas(personas + 1));

    function asisteValue() {
      const c = form.querySelector('input[name="asiste"]:checked');
      return c ? c.value : null;
    }

    form.addEventListener('change', (e) => {
      if (e.target.name === 'asiste') {
        const yes = e.target.value === 'si';
        people.hidden = !yes;
        $('#calNote').hidden = !yes;
        e.target.closest('.field').classList.remove('is-invalid');
        $('#errAsiste').hidden = true;
        vibrate(20);
      }
    });
    $('#fNombre').addEventListener('input', (e) => {
      if (e.target.value.trim()) {
        e.target.closest('.field').classList.remove('is-invalid');
        $('#errNombre').hidden = true;
      }
    });

    function validate() {
      let ok = true;
      const nombre = $('#fNombre');
      if (!nombre.value.trim()) {
        nombre.closest('.field').classList.add('is-invalid');
        $('#errNombre').hidden = false;
        ok = false;
      }
      if (!asisteValue()) {
        $('.choice').classList.add('is-invalid');
        $('#errAsiste').hidden = false;
        ok = false;
      }
      if (!ok) {
        const first = form.querySelector('.is-invalid');
        first.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        if (!nombre.value.trim()) nombre.focus({ preventScroll: true });
        vibrate([40, 40, 40]);
      }
      return ok;
    }

    function setLoading(on) {
      submit.disabled = on;
      submit.classList.toggle('is-loading', on);
      submit.querySelector('.btn__label').textContent = on ? 'Enviando…' : 'Enviar respuesta';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.hidden = true;
      if (!validate()) return;

      const prev = store.get();
      const asiste = asisteValue() === 'si';
      const payload = {
        id: (prev && prev.id) || uid(),
        nombre: $('#fNombre').value.trim().slice(0, 80),
        asiste,
        personas: asiste ? personas : 0,
        mensaje: $('#fMensaje').value.trim().slice(0, 300),
        invitado,
        cupos,
      };

      setLoading(true);
      try {
        await Api.enviar(payload);
        const nuevoSi = asiste && !(prev && prev.asiste);
        store.set({ ...payload, cal: asiste && prev && prev.cal });
        showDone(store.get(), true);
        // En iPhone/Mac el calendario se abre solo (hoja nativa "Añadir"); en Android basta un toque
        if (nuevoSi && Cal.canAutoOpen()) setTimeout(openCalendar, 1200);
        window.dispatchEvent(new Event('pika:rsvp'));
        if (Api.isDemo()) toast('Modo demo: guardado en este navegador');
      } catch (err) {
        console.error(err);
        errBox.textContent = navigator.onLine
          ? '¡Ups! No pudimos enviar tu respuesta. Intenta de nuevo en un momento.'
          : 'Parece que no tienes conexión. Revisa tu internet e intenta de nuevo.';
        errBox.hidden = false;
        vibrate([60, 40, 60]);
      } finally {
        setLoading(false);
      }
    });

    function showDone(data, fresh) {
      form.hidden = true;
      done.hidden = false;
      const badge = $('#doneBadge');
      const primerNombre = data.nombre.length <= 18 ? data.nombre : data.nombre.split(' ')[0];
      if (data.asiste) {
        badge.className = 'done__badge';
        badge.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-bolt"/></svg>';
        $('#doneTitle').textContent = fresh ? `¡Genial, ${primerNombre}!` : `¡Ya estás en el equipo, ${primerNombre}!`;
        const quien = data.personas === 1 ? '<strong>1 persona</strong>' : `<strong>${data.personas} personas</strong>`;
        $('#doneText').innerHTML = `Confirmaste ${quien}. ¡Te esperamos el <strong>${fmtFecha.format(inicio)}</strong> a las <strong>${fmtHora.format(inicio)}</strong>!`;
        $('#doneCal').hidden = false;
        setCalState(!!data.cal);
        if (fresh) {
          confetti();
          vibrate([50, 50, 120]);
          zap($('#pika'));
        }
      } else {
        badge.className = 'done__badge is-no';
        badge.innerHTML = '<svg viewBox="0 0 24 24"><use href="#i-ball"/></svg>';
        $('#doneTitle').textContent = fresh ? '¡Gracias por avisarnos!' : 'Tu respuesta está registrada';
        $('#doneText').innerHTML = `Te vamos a extrañar, ${escapeHtml(primerNombre)}. Si cambias de opinión, puedes actualizar tu respuesta aquí.`;
        $('#doneCal').hidden = true;
      }
      $('#heroCta span').textContent = 'Ver mi respuesta';
      if (fresh) {
        done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        done.focus({ preventScroll: true });
      }
    }

    function setCalState(saved) {
      const btn = $('#btnCalMain');
      btn.classList.toggle('btn--pulse', !saved);
      btn.classList.toggle('is-saved', saved);
      $('#btnCalMain span').textContent = saved ? '¡Listo! Abrir de nuevo' : Cal.mainLabel();
      $('#calHint').textContent = saved
        ? '¿No se guardó? Toca el botón otra vez o prueba con otro calendario abajo.'
        : Cal.hint();
      $('#calStep').hidden = saved;
    }

    function markCalSaved() {
      const cur = store.get();
      if (cur) store.set({ ...cur, cal: true });
      setTimeout(() => setCalState(true), 600);
    }

    function openCalendar() {
      Cal.add();
      markCalSaved();
    }

    $('#btnCalMain').addEventListener('click', openCalendar);
    $('#btnCalApple').addEventListener('click', () => {
      Cal.openApple();
      markCalSaved();
    });
    $('#btnCalGoogle').addEventListener('click', markCalSaved);

    $('#btnChange').addEventListener('click', () => {
      const prev = store.get();
      done.hidden = true;
      form.hidden = false;
      if (prev) {
        $('#fNombre').value = prev.nombre;
        $('#fMensaje').value = prev.mensaje || '';
        const radio = form.querySelector(`input[name="asiste"][value="${prev.asiste ? 'si' : 'no'}"]`);
        radio.checked = true;
        people.hidden = !prev.asiste;
        $('#calNote').hidden = !prev.asiste;
        setPersonas(prev.asiste ? prev.personas : 1);
      }
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    // Estado inicial
    const prev = store.get();
    if (limite && Date.now() > limite.getTime() && !prev) {
      form.hidden = true;
      $('#closed').hidden = false;
      $('#heroCta span').textContent = 'Ver detalles';
      return;
    }
    if (prev) showDone(prev, false);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // ---------- Init ----------
  // ?reset=1 borra las respuestas de prueba guardadas en este navegador
  function resetLocal() {
    if (params.get('reset') !== '1') return false;
    try {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem('pika-demo-db');
      sessionStorage.removeItem('pika-admin-key');
    } catch (_) {}
    params.delete('reset');
    const q = params.toString();
    location.replace(location.pathname + (q ? '?' + q : '') + location.hash);
    return true;
  }

  function init() {
    if (resetLocal()) return;
    bind();
    intro();
    pikachu();
    countdown();
    rsvp();
    observers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
