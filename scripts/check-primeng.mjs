#!/usr/bin/env node
/**
 * Impide que el front de Academical use controles nativos o módulos obsoletos donde PrimeNG tiene el componente.
 *
 * Regla del dueño (2026-11-04, la pidió dos veces): TODO en PrimeNG, sin excepciones y sin copiar un patrón viejo. Recorre todas las plantillas
 * (`.html` y las `template:` en línea de los `.ts`) y cuenta, por archivo y por regla:
 *   - controles nativos: `<button>`, `<select>`, `<table>`, `<ul>`, `<ol>`, `<progress>`, `<dialog>`, `<textarea>` sin `pTextarea`, `<input>` sin
 *     `pInputText` y los `type="date|datetime-local|number|checkbox|radio|file|range|time|month|week|color"`;
 *   - módulos o etiquetas obsoletos de PrimeNG: `calendar`, `dropdown`, `tabview`, `overlaypanel`, `inputswitch`, `sidebar`, `chips`.
 * Los archivos antiguos tienen un tope (components-catalog/primeng-baseline.json, que también lee la pestaña Auditoría del catálogo) que solo puede bajar; un archivo nuevo o tocado debe quedar en cero:
 * `node scripts/check-primeng.mjs --fix-baseline` baja el tope cuando se limpia uno. Una línea con `primeng-ok: motivo` (o la anterior) exime ese uso.
 *
 * El catálogo de componentes (/admin/components) es la fuente de verdad de qué componente corresponde a cada necesidad.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src/app', import.meta.url));
const BASELINE_FILE = fileURLToPath(new URL('../src/app/dashboard/staff/shared/components-catalog/primeng-baseline.json', import.meta.url));

const NATIVE_TYPES = 'date|datetime-local|number|checkbox|radio|file|range|time|month|week|color';

/** Cada regla busca en una plantilla; `exempt` descarta un resultado (por ejemplo, un `<input>` que ya lleva la directiva de PrimeNG). */
export const RULES = [
  { name: '<button> nativo', regex: /<button\b/gi, fix: 'p-button' },
  { name: '<select> nativo', regex: /<select\b/gi, fix: 'p-select' },
  { name: '<table> nativo', regex: /<table\b/gi, fix: 'p-table' },
  { name: '<ul> nativo', regex: /<ul\b/gi, fix: 'p-timeline, p-dataview o p-table' },
  { name: '<ol> nativo', regex: /<ol\b/gi, fix: 'p-timeline, p-dataview o p-steps' },
  { name: '<progress> nativo', regex: /<progress\b/gi, fix: 'p-progressbar' },
  { name: '<dialog> nativo', regex: /<dialog\b/gi, fix: 'p-dialog' },
  { name: '<textarea> sin pTextarea', regex: /<textarea\b[^>]*>/gi, exempt: (tag) => /pTextarea/.test(tag), fix: 'pTextarea' },
  { name: '<input> sin directiva de PrimeNG', regex: /<input\b[^>]*>/gi, exempt: (tag) => /pInputText|pInputMask|type="hidden"|type=['"]?hidden/.test(tag) || new RegExp(`type="(?:${NATIVE_TYPES})"`).test(tag), fix: 'pInputText' },
  { name: 'input nativo de fecha, número, casilla, opción o archivo', regex: new RegExp(`<input\\b[^>]*type="(?:${NATIVE_TYPES})"[^>]*>`, 'gi'), fix: 'p-datepicker, p-inputnumber, p-checkbox, p-radiobutton o p-fileupload' },
  { name: 'etiqueta obsoleta de PrimeNG', regex: /<p-(?:calendar|dropdown|tabView|overlayPanel|inputSwitch|sidebar|chips)\b/g, fix: 'p-datepicker, p-select, p-tabs, p-popover, p-toggleswitch, p-drawer, p-autocomplete' },
  { name: 'módulo obsoleto de PrimeNG', regex: /from\s+'primeng\/(?:calendar|dropdown|tabview|overlaypanel|inputswitch|sidebar|chips)'/g, source: true, fix: 'datepicker, select, tabs, popover, toggleswitch, drawer, autocomplete' },
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.(html|ts)$/.test(name) && !/\.spec\.ts$/.test(name) ? [full] : [];
  });
}

/** Las partes de un archivo que son plantilla: todo un `.html`, o el texto de cada `template: \`...\`` de un `.ts`. Los módulos obsoletos se buscan en el `.ts` entero. */
function templatesOf(file, text) {
  if (file.endsWith('.html')) return [text];

  return [...text.matchAll(/template:\s*`([\s\S]*?)`/g)].map((match) => match[1]);
}

/** Cuenta los usos por regla en un archivo; `file` decide si es plantilla o código. */
export function scanFile(file, text) {
  const lines = text.split(/\r?\n/);
  const exemptLines = new Set(lines.flatMap((line, index) => (line.includes('primeng-ok') ? [index, index + 1] : [])));
  const found = {};

  const count = (rule, haystack, offset) => {
    for (const match of haystack.matchAll(rule.regex)) {
      if (rule.exempt?.(match[0])) continue;
      const line = text.slice(0, offset + (match.index ?? 0)).split(/\r?\n/).length - 1;
      if (exemptLines.has(line)) continue;
      found[rule.name] = (found[rule.name] ?? 0) + 1;
    }
  };

  for (const rule of RULES) {
    if (rule.source) {
      if (file.endsWith('.ts')) count(rule, text, 0);
      continue;
    }
    for (const template of templatesOf(file, text)) count(rule, template, Math.max(0, text.indexOf(template)));
  }

  return found;
}

function scanAll() {
  const result = {};
  for (const file of walk(ROOT)) {
    const found = scanFile(file, readFileSync(file, 'utf8'));
    if (Object.keys(found).length > 0) result[relative(ROOT, file).split('\\').join('/')] = found;
  }

  return result;
}

function main() {
  const counts = scanAll();
  const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};

  if (process.argv.includes('--fix-baseline')) {
    writeFileSync(BASELINE_FILE, JSON.stringify(counts, null, 2) + '\n');
    console.log(`Tope actualizado: ${Object.keys(counts).length} archivo(s) con controles nativos u obsoletos.`);
    return 0;
  }

  const errors = [];
  for (const [file, rules] of Object.entries(counts)) {
    for (const [rule, count] of Object.entries(rules)) {
      const cap = baseline[file]?.[rule] ?? 0;
      if (count > cap) errors.push({ file, rule, count, cap });
    }
  }

  if (errors.length > 0) {
    console.error('Estos archivos usan controles nativos u obsoletos donde PrimeNG tiene el componente (más que su tope):');
    for (const { file, rule, count, cap } of errors) {
      const fix = RULES.find((item) => item.name === rule)?.fix;
      console.error(`  ${file}: ${rule}: ${count} (tope ${cap})${fix ? ` → usa ${fix}` : ''}`);
    }
    console.error('Mira el catálogo (/admin/components) y docs/frontend-components.md. Una línea con `primeng-ok: motivo` exime un uso justificado.');
    return 1;
  }

  const improvable = Object.entries(baseline).filter(([file, rules]) => Object.entries(rules).some(([rule, cap]) => (counts[file]?.[rule] ?? 0) < cap));
  if (improvable.length > 0) console.log(`Hay ${improvable.length} archivo(s) con menos usos que su tope: ejecuta con --fix-baseline para bajarlo.`);
  console.log(`PrimeNG: ${Object.keys(counts).length} archivo(s) antiguos dentro de su tope, ninguno nuevo.`);

  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(main());
}
