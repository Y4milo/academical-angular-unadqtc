#!/usr/bin/env node
/*
 * Icons are Lucide (docs/frontend-components.md, section "Icons"). This fails when a template or component uses the PrimeIcons font
 * (`pi pi-...`, `pi-...`, class="pi"): use <app-lucide-icon name="..."> or, where PrimeNG only takes a class, `lucideClass('...')` / `| lucideClass`.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'src');
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') && !entry.name.includes('lucide-icon.util')) files.push(p);
  }
})(root);

const pattern = /\bpi pi-[a-z0-9-]+|['"`]pi-[a-z0-9-]+['"`]|class="pi"|\[class\.pi-[a-z0-9-]+\]/;
const found = [];
for (const file of files) {
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (pattern.test(line)) found.push(`${path.relative(process.cwd(), file)}:${i + 1}: ${line.trim().slice(0, 110)}`);
  });
}
if (found.length) {
  console.error(`Íconos: ${found.length} uso(s) de PrimeIcons. Usa <app-lucide-icon> o lucideClass() (ver docs/frontend-components.md).`);
  found.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log('Íconos: todo es Lucide.');
