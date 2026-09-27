// Genera evento.ics a partir de js/config.js
// Uso: node scripts/generar-ics.mjs  (ejecútalo cada vez que cambies la fecha, hora o lugar)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const ctx = { TextEncoder, URLSearchParams };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(root + 'js/config.js', 'utf8'), ctx);
vm.runInContext(readFileSync(root + 'js/calendar.js', 'utf8'), ctx);

const ics = ctx.PikaCalendar.icsText();
writeFileSync(root + 'evento.ics', ics);
console.log('✔ evento.ics generado\n');
console.log(ics);
