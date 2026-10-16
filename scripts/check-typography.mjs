#!/usr/bin/env node
/**
 * Impide que el CSS y las plantillas de Academical inventen pesos y tamaños de letra.
 *
 * Regla: el peso sale de `--weight-regular|strong|title` y el tamaño de `--text-title|card-title|body|small|label`
 * (definidos una sola vez en src/styles.css y mostrados en el catálogo /admin/components). Se revisan css, html y los estilos dentro
 * de los componentes (.ts, sin specs). Se cuentan los valores literales:
 * `font-weight: 650`, `font-weight: bold`, `font-size: .82rem`, `font-size: 14px`...
 *
 * Los archivos antiguos tienen un tope (typography-baseline.json) que solo puede bajar; los archivos nuevos o tocados deben quedar
 * en cero: `node scripts/check-typography.mjs --fix-baseline` baja el tope cuando se limpia uno. Los iconos (`<i ...>`) en html se ignoran.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/app', import.meta.url));
const BASELINE_FILE = fileURLToPath(new URL('./typography-baseline.json', import.meta.url));

const RULES = [
  { name: 'peso literal', regex: /font-weight\s*:\s*(?:[1-9]00|bold|bolder|lighter|normal)\b/g },
  { name: 'tamaño literal', regex: /font-size\s*:\s*[\d.]+(?:rem|px|em)\b/g },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : /\.(css|html)$/.test(name) || (/\.ts$/.test(name) && !/\.spec\.ts$/.test(name)) ? [full] : [];
  });
}

const counts = {};
for (const file of walk(ROOT)) {
  // Un icono (<i class="pi ..." style="font-size: 4rem">) lleva su propio tamaño: no es texto de la escala.
  const text = readFileSync(file, 'utf8').replace(/<i[^>]*>/g, '');
  const found = RULES.reduce((total, rule) => total + (text.match(rule.regex)?.length ?? 0), 0);
  if (found > 0) counts[relative(ROOT, file).split('\\').join('/')] = found;
}

const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};

if (process.argv.includes('--fix-baseline')) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE_FILE, JSON.stringify(sorted, null, 2) + '\n');
  console.log(`Tope actualizado: ${Object.keys(counts).length} archivos con pesos o tamaños literales.`);
  process.exit(0);
}

const errors = Object.entries(counts).filter(([file, count]) => count > (baseline[file] ?? 0));
if (errors.length > 0) {
  console.error('Estos archivos usan pesos o tamaños de letra literales (más que su tope):');
  for (const [file, count] of errors) console.error(`  ${file}: ${count} (tope ${baseline[file] ?? 0})`);
  console.error('Usa var(--weight-regular|strong|title) y var(--text-title|card-title|body|small|label) (ver docs/frontend-components.md, sección «Tipografía»).');
  process.exit(1);
}

const improvable = Object.keys(baseline).filter((file) => (counts[file] ?? 0) < baseline[file]);
if (improvable.length > 0) console.log(`Hay ${improvable.length} archivo(s) con menos valores que su tope: ejecuta con --fix-baseline para bajarlo.`);
console.log(`Tipografía: ${Object.keys(counts).length} archivo(s) antiguos dentro de su tope, ninguno nuevo.`);
