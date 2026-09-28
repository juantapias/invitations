// Aísla un CSS de tema bajo .theme-<id> y prefija sus @keyframes.
// Uso: node scripts/scope-theme-css.cjs src/themes/pikachu/styles.src.css src/themes/pikachu/styles.css pikachu pk-
// (Solo hace falta para temas escritos sin prefijo; los temas nuevos pueden escribirse ya aislados.)
const fs = require('fs');
const postcss = require(process.cwd() + '/node_modules/postcss');
const [,, input, output, id, kfPrefix] = process.argv;
const scope = `.theme-${id}`;
const root = postcss.parse(fs.readFileSync(input, 'utf8'));
const kf = new Set();
root.walkAtRules(/keyframes$/, (a) => { kf.add(a.params); a.params = kfPrefix + a.params; });
root.walkRules((rule) => {
  if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.map((sel) => {
    sel = sel.trim();
    if (sel === ':root') return `html:has(${scope})`;
    // html / body → documento que contiene este tema
    let m = /^(html|body)((?:[.:][\w-]+(?:\([^)]*\))?)*)(\s.*)?$/.exec(sel);
    if (m) {
      const [, el, mods, rest] = m;
      return `${el}${mods}:has(${scope})${rest ?? ''}`;
    }
    return `${scope} ${sel}`;
  });
});
root.walkDecls(/^animation(-name)?$/, (d) => {
  d.value = d.value.split(',').map((part) => part.trim().split(/\s+/).map((tok) => (kf.has(tok) ? kfPrefix + tok : tok)).join(' ')).join(', ');
});
fs.writeFileSync(output, `/* ⚠️ Generado desde styles.src.css — aislado bajo ${scope}. */\n` + root.toString());
console.log('keyframes:', [...kf].length, '→', output);
