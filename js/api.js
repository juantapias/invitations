/* Comunicación con Google Apps Script (o modo demo en localStorage) */
(function () {
  'use strict';
  const CFG = window.INVITACION;
  const DEMO_KEY = 'pika-demo-db';

  function demoRead() {
    try {
      return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function demoWrite(rows) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(rows));
    } catch (_) {}
  }

  async function request(url, opts) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error del servidor');
      return json;
    } finally {
      clearTimeout(t);
    }
  }

  async function enviar(payload) {
    if (!CFG.apiUrl) {
      await new Promise((r) => setTimeout(r, 700));
      const rows = demoRead().filter((r) => r.id !== payload.id);
      rows.push({ ...payload, fecha: new Date().toISOString() });
      demoWrite(rows);
      return { ok: true, demo: true };
    }
    // text/plain evita el preflight CORS que Apps Script no soporta
    return request(CFG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  }

  async function listar(key) {
    if (!CFG.apiUrl) return { ok: true, demo: true, rows: demoRead() };
    const url = `${CFG.apiUrl}?action=list&key=${encodeURIComponent(key)}&t=${Date.now()}`;
    return request(url, { method: 'GET' });
  }

  window.PikaApi = { enviar, listar, isDemo: () => !CFG.apiUrl };
})();
