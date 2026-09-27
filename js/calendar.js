/* Genera el evento para Google Calendar y Apple Calendar (.ics) */
(function () {
  'use strict';
  const CFG = window.INVITACION;

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMac = /Macintosh/.test(ua) && !isIOS;

  function platform() {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    if (isMac) return 'mac';
    return 'other';
  }

  // 20261114T200000Z
  function toUTC(iso) {
    return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function inviteUrl() {
    return location.origin + location.pathname;
  }

  function mapsQuery() {
    const l = CFG.lugar;
    return l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : l.busquedaMapa || l.direccion;
  }

  function event() {
    return {
      title: `Cumpleaños de ${CFG.festejado} ⚡`,
      details:
        `¡${CFG.festejado} cumple ${CFG.edad}! ${CFG.frase}\n` +
        (CFG.vestimenta ? `Vestimenta: ${CFG.vestimenta}\n` : '') +
        `Invitación: ${inviteUrl()}`,
      location: `${CFG.lugar.nombre}, ${CFG.lugar.direccion}`,
      start: toUTC(CFG.inicio),
      end: toUTC(CFG.fin),
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

  function icsText() {
    const e = event();
    const uid = `cumple-${CFG.festejado}-${e.start}@invitacion-pikachu`.replace(/\s+/g, '-').toLowerCase();
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Invitacion Pikachu//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${toUTC(new Date().toISOString())}`,
      `DTSTART:${e.start}`,
      `DTEND:${e.end}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.details)}`,
      `LOCATION:${esc(e.location)}`,
      `URL:${inviteUrl()}`,
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
    ];
    return lines.map(fold).join('\r\n');
  }

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

  function openGoogle() {
    const w = window.open(googleUrl(), '_blank', 'noopener');
    return !!w;
  }

  // Abre el diálogo nativo de "Agregar evento" según el teléfono.
  function add() {
    const p = platform();
    if (p === 'ios' || p === 'mac') {
      downloadIcs();
      return true;
    }
    return openGoogle();
  }

  window.PikaCalendar = { platform, googleUrl, icsText, downloadIcs, openGoogle, add, mapsQuery };
})();
