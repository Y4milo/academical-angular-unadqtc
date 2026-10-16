#!/usr/bin/env node
/**
 * Impide que el CSS de Academical use colores que no cambian con el tema claro/oscuro.
 *
 * Regla: los nombres antiguos de PrimeNG (--surface-card, --surface-border, --surface-ground, --text-color,
 * --text-color-secondary, --primary-color) no existen con PrimeNG 19; `var(--surface-card, #fff)` siempre cae al
 * fallback claro. Solo se permite una cadena que termine en un token `--p-*` (var(--surface-card, var(--p-content-background))).
 * Las paletas fijas (--p-surface-N, --p-primary-N con N de 50 a 950) tampoco cambian con el tema y no sirven para fondos ni texto.
 *
 * Los archivos antiguos tienen un tope (theme-tokens-baseline.json) que solo puede bajar; los archivos nuevos o tocados
 * deben quedar en cero: `node scripts/check-theme-tokens.mjs --fix-baseline` baja el tope cuando se limpia uno.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/app', import.meta.url));
const BASELINE_FILE = fileURLToPath(new URL('./theme-tokens-baseline.json', import.meta.url));

const LEGACY = '(?:surface-card|surface-border|surface-ground|surface-section|text-color-secondary|text-color|primary-color)';
const RULES = [
  { name: 'fallback claro fijo', regex: new RegExp(`var\\(--${LEGACY}\\s*,\\s*(?:#|rgb|white|black)`, 'g') },
  { name: 'token antiguo sin respaldo', regex: new RegExp(`var\\(--${LEGACY}\\s*\\)`, 'g') },
  { name: 'paleta fija en fondo o texto', regex: /(?:background|color|border[a-z-]*)\s*:\s*[^;{}]*var\(--p-(?:surface|primary)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(css|html)$/.test(name) ? [full] : [];
  });
}

const counts = {};
for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8');
  const found = RULES.reduce((total, rule) => total + (text.match(rule.regex)?.length ?? 0), 0);
  if (found > 0) counts[relative(ROOT, file).split('\\').join('/')] = found;
}

const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};

if (process.argv.includes('--fix-baseline')) {
  writeFileSync(BASELINE_FILE, JSON.stringify(counts, null, 2) + '\n');
  console.log(`Tope actualizado: ${Object.keys(counts).length} archivos con valores que no siguen el tema.`);
  process.exit(0);
}

const errors = Object.entries(counts).filter(([file, count]) => count > (baseline[file] ?? 0));
if (errors.length > 0) {
  console.error('Estos archivos usan colores que no cambian con el tema claro/oscuro (más que su tope):');
  for (const [file, count] of errors) console.error(`  ${file}: ${count} (tope ${baseline[file] ?? 0})`);
  console.error('Usa tokens --p-* (ver docs/frontend-components.md, sección «Tema claro y oscuro»).');
  process.exit(1);
}

const improvable = Object.keys(baseline).filter((file) => (counts[file] ?? 0) < baseline[file]);
if (improvable.length > 0) console.log(`Hay ${improvable.length} archivo(s) con menos valores que su tope: ejecuta con --fix-baseline para bajarlo.`);
console.log(`Tema: ${Object.keys(counts).length} archivo(s) antiguos dentro de su tope, ninguno nuevo.`);
