/* Genera el evento para Google Calendar y Apple Calendar (.ics) */
(function (root) {
  'use strict';
  const CFG = root.INVITACION;
  const ICS_FILE = 'evento.ics'; // generado con: node scripts/generar-ics.mjs

  const nav = root.navigator || {};
  const ua = nav.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh/.test(ua) && !isIOS;
  // Navegadores internos de Instagram/Facebook/TikTok no abren archivos de calendario
  const isInApp = /FBAN|FBAV|Instagram|Line\/|musical_ly|TikTok/i.test(ua);

  function platform() {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    if (isMac) return 'mac';
    return 'other';
  }

  // 20261025T190000Z
  function toUTC(iso) {
    return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function inviteUrl() {
    if (CFG.urlPublica) return CFG.urlPublica;
    return root.location ? root.location.origin + root.location.pathname : '';
  }

  function mapsQuery() {
    const l = CFG.lugar;
    return l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : l.busquedaMapa || l.direccion;
  }

  function event() {
    const url = inviteUrl();
    return {
      title: `Cumpleaños de ${CFG.festejado} ⚡`,
      details:
        `¡${CFG.festejado} cumple ${CFG.edad}! ${CFG.frase}` +
        (CFG.notaHora ? `\n${CFG.notaHora}` : '') +
        (CFG.vestimenta ? `\nVestimenta: ${CFG.vestimenta}` : '') +
        (url ? `\nInvitación: ${url}` : ''),
      location: `${CFG.lugar.nombre}, ${CFG.lugar.direccion}`,
      start: toUTC(CFG.inicio),
      end: toUTC(CFG.fin),
      url,
    };
  }

  function googleUrl() {
    const e = event();
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: e.title,
      dates: `${e.start}/${e.end}`,
      details: e.details,
      location: e.location,
      ctz: CFG.zonaHoraria,
    });
    return `https://calendar.google.com/calendar/render?${p.toString()}`;
  }

  function esc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  // RFC 5545: líneas de máximo 75 octetos
  function fold(line) {
    const enc = new TextEncoder();
    if (enc.encode(line).length <= 75) return line;
    const out = [];
    let cur = '';
    for (const ch of line) {
      if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
        out.push(cur);
        cur = ch;
      } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  function icsText(stamp) {
    const e = event();
    const uid = `cumple-${CFG.festejado}-${e.start}@invitacion-pikachu`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Invitacion Pikachu//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${esc(e.title)}`,
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${toUTC(stamp || new Date().toISOString())}`,
      `DTSTART:${e.start}`,
      `DTEND:${e.end}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.details)}`,
      `LOCATION:${esc(e.location)}`,
      e.url ? `URL:${e.url}` : null,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc('Mañana es el cumpleaños de ' + CFG.festejado)}`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc('En 2 horas: cumpleaños de ' + CFG.festejado)}`,
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean);
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  // ¿Está publicado evento.ics? (permite abrir el calendario del iPhone sin descargas)
  let staticIcs = null;
  function checkStaticIcs() {
    if (staticIcs || !root.fetch) return staticIcs;
    staticIcs = fetch(ICS_FILE, { method: 'HEAD', cache: 'no-store' })
      .then((r) => r.ok)
      .catch(() => false);
    return staticIcs;
  }
  let staticOk = false;

  function downloadIcs() {
    const blob = new Blob([icsText()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cumple-${CFG.festejado}.ics`.toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // Apple Calendar / Outlook: abre la hoja nativa "Añadir al calendario"
  function openApple() {
    if (staticOk) {
      root.location.href = ICS_FILE;
    } else {
      downloadIcs();
    }
  }

  // Google Calendar: formulario del evento ya lleno, solo falta "Guardar"
  function openGoogle() {
    const url = googleUrl();
    // (con 'noopener' window.open siempre devuelve null, por eso se corta el opener a mano)
    const w = root.open(url, '_blank');
    if (w) w.opener = null;
    else root.location.href = url;
  }

  function add() {
    const p = platform();
    if ((p === 'ios' || p === 'mac') && !isInApp) openApple();
    else openGoogle();
  }

  function mainLabel() {
    return 'Guardar en mi calendario';
  }

  function hint() {
    const p = platform();
    if (isInApp) return 'Se abrirá Google Calendar. Si usas iPhone, abre esta invitación en Safari para usar el calendario del teléfono.';
    if (p === 'ios') return 'Se abrirá el calendario de tu iPhone: solo toca «Añadir».';
    if (p === 'mac') return 'Se abrirá el Calendario de tu Mac: solo toca «Añadir».';
    if (p === 'android') return 'Se abrirá Google Calendar con todo listo: solo toca «Guardar».';
    return 'Se abrirá Google Calendar con todo listo: solo toca «Guardar».';
  }

  if (root.document) {
    const p = checkStaticIcs();
    if (p) p.then((ok) => (staticOk = ok));
  }

  root.PikaCalendar = {
    platform, googleUrl, icsText, downloadIcs, openApple, openGoogle, add, mapsQuery, mainLabel, hint,
    canAutoOpen: () => (platform() === 'ios' || platform() === 'mac') && !isInApp && staticOk,
  };
})(typeof window !== 'undefined' ? window : globalThis);
