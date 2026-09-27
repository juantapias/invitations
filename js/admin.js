(function () {
  'use strict';
  const CFG = window.INVITACION;
  const Api = window.PikaApi;
  const $ = (s) => document.querySelector(s);
  const KEY_STORE = 'pika-admin-key';

  let rows = [];
  let tab = 'si';

  const fmt = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

  function getKey() {
    try {
      return sessionStorage.getItem(KEY_STORE) || '';
    } catch (_) {
      return '';
    }
  }
  function setKey(k) {
    try {
      sessionStorage.setItem(KEY_STORE, k);
    } catch (_) {}
  }

  async function load(key) {
    $('#refresh').disabled = true;
    try {
      const res = await Api.listar(key);
      rows = (res.rows || []).slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      $('#loginForm').hidden = true;
      $('#dash').hidden = false;
      render();
      $('#updated').textContent = 'Actualizado: ' + fmt.format(new Date());
      return true;
    } catch (err) {
      $('#loginForm').hidden = false;
      $('#dash').hidden = true;
      const e = $('#loginError');
      e.textContent = err.message === 'Clave incorrecta' ? 'Clave incorrecta.' : 'No se pudo cargar: ' + err.message;
      e.hidden = false;
      return false;
    } finally {
      $('#refresh').disabled = false;
    }
  }

  function render() {
    const si = rows.filter((r) => r.asiste);
    const no = rows.filter((r) => !r.asiste);
    const total = si.reduce((a, r) => a + (Number(r.personas) || 0), 0);
    $('#sPersonas').textContent = total;
    $('#sSi').textContent = si.length;
    $('#sNo').textContent = no.length;
    $('#tSi').textContent = si.length;
    $('#tNo').textContent = no.length;

    const q = $('#search').value.trim().toLowerCase();
    const list = (tab === 'si' ? si : no).filter(
      (r) => !q || String(r.nombre).toLowerCase().includes(q) || String(r.invitado || '').toLowerCase().includes(q)
    );

    const ul = $('#list');
    ul.innerHTML = '';
    list.forEach((r) => {
      const li = document.createElement('li');
      li.className = 'guest';
      const name = document.createElement('span');
      name.className = 'guest__name';
      name.textContent = r.nombre;
      li.appendChild(name);
      if (r.asiste) {
        const c = document.createElement('span');
        c.className = 'guest__count';
        c.textContent = r.personas;
        c.title = `${r.personas} persona(s)`;
        li.appendChild(c);
      }
      const meta = document.createElement('span');
      meta.className = 'guest__meta';
      const parts = [];
      if (r.fecha) parts.push(fmt.format(new Date(r.fecha)));
      if (r.invitado && r.invitado !== r.nombre) parts.push('Enlace: ' + r.invitado);
      meta.textContent = parts.join(' · ');
      li.appendChild(meta);
      if (r.mensaje) {
        const m = document.createElement('p');
        m.className = 'guest__msg';
        m.textContent = '“' + r.mensaje + '”';
        li.appendChild(m);
      }
      ul.appendChild(li);
    });
    $('#empty').hidden = list.length > 0;
  }

  function csv() {
    const esc = (v) => {
      let s = String(v == null ? '' : v);
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const head = ['Nombre', 'Asiste', 'Personas', 'Mensaje', 'Enlace', 'Fecha'];
    const lines = [head.map(esc).join(',')].concat(
      rows.map((r) => [r.nombre, r.asiste ? 'Sí' : 'No', r.personas, r.mensaje, r.invitado, r.fecha].map(esc).join(','))
    );
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invitados-${CFG.festejado}.csv`.toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  function init() {
    $('#subtitle').textContent = `Cumpleaños de ${CFG.festejado}`;
    document.querySelectorAll('.tab').forEach((b) =>
      b.addEventListener('click', () => {
        tab = b.dataset.tab;
        document.querySelectorAll('.tab').forEach((x) => {
          x.classList.toggle('is-active', x === b);
          x.setAttribute('aria-selected', String(x === b));
        });
        render();
      })
    );
    $('#search').addEventListener('input', render);
    $('#refresh').addEventListener('click', () => load(getKey()));
    $('#csv').addEventListener('click', csv);
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const k = $('#key').value.trim();
      if (await load(k)) setKey(k);
    });

    if (Api.isDemo()) {
      $('#demoNote').hidden = false;
      load('');
    } else if (getKey()) {
      load(getKey());
    } else {
      $('#loginForm').hidden = false;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
