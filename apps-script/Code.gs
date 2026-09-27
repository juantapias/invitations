/**
 * ⚡ Backend de confirmaciones — Google Apps Script + Google Sheets
 *
 * 1. Crea una hoja de cálculo nueva en Google Sheets.
 * 2. Extensiones → Apps Script → pega este archivo completo.
 * 3. Cambia ADMIN_KEY por una clave propia.
 * 4. Implementar → Nueva implementación → Tipo: Aplicación web
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier persona
 * 5. Copia la URL (termina en /exec) y pégala en js/config.js → apiUrl.
 */

const ADMIN_KEY = 'CAMBIA-ESTA-CLAVE';
const SHEET_NAME = 'Respuestas';
const MAX_PERSONAS = 20;
const HEADERS = ['ID', 'Actualizado', 'Nombre', 'Asiste', 'Personas', 'Mensaje', 'Invitación', 'Cupos'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    const id = String(d.id || '').replace(/[^\w-]/g, '').slice(0, 64);
    const nombre = clean_(d.nombre, 80);
    if (!id || !nombre) return json_({ ok: false, error: 'Datos incompletos' });

    const asiste = d.asiste === true;
    const cupos = clampInt_(d.cupos, 1, MAX_PERSONAS, MAX_PERSONAS);
    const personas = asiste ? clampInt_(d.personas, 1, cupos, 1) : 0;

    const row = [id, new Date(), nombre, asiste ? 'Sí' : 'No', personas, clean_(d.mensaje, 300), clean_(d.invitado, 80), cupos];

    const sh = sheet_();
    const last = sh.getLastRow();
    let target = 0;
    if (last > 1) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === id) {
          target = i + 2;
          break;
        }
      }
    }
    if (target) sh.getRange(target, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    return json_({ ok: true, updated: !!target });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {}
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action !== 'list') return json_({ ok: true, service: 'invitacion-pikachu' });
  if (p.key !== ADMIN_KEY) return json_({ ok: false, error: 'Clave incorrecta' });

  const sh = sheet_();
  const last = sh.getLastRow();
  const rows =
    last > 1
      ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues().map(function (r) {
          return {
            id: r[0],
            fecha: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
            nombre: String(r[2]).replace(/^'/, ''),
            asiste: r[3] === 'Sí',
            personas: Number(r[4]) || 0,
            mensaje: String(r[5]).replace(/^'/, ''),
            invitado: String(r[6]).replace(/^'/, ''),
            cupos: Number(r[7]) || 0,
          };
        })
      : [];
  return json_({ ok: true, rows: rows });
}

/** Ejecuta esta función una vez desde el editor para dar formato a la hoja. */
function setup() {
  sheet_();
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#FFCB05');
    sh.setFrozenRows(1);
    sh.hideColumns(1);
  }
  return sh;
}

function clean_(v, max) {
  let s = String(v == null ? '' : v)
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
  // Evita inyección de fórmulas en Sheets
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function clampInt_(v, min, max, def) {
  const n = parseInt(v, 10);
  if (!isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
