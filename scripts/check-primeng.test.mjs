import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scanFile } from './check-primeng.mjs';

const html = (text) => scanFile('x.component.html', text);

test('cuenta cada control nativo por regla', () => {
  const found = html('<button>a</button><button>b</button><ul><li>x</li></ul><table></table><select></select><ol></ol><progress></progress><dialog></dialog>');

  assert.equal(found['<button> nativo'], 2);
  assert.equal(found['<ul> nativo'], 1);
  assert.equal(found['<table> nativo'], 1);
  assert.equal(found['<select> nativo'], 1);
  assert.equal(found['<ol> nativo'], 1);
  assert.equal(found['<progress> nativo'], 1);
  assert.equal(found['<dialog> nativo'], 1);
});

test('los componentes de PrimeNG no se cuentan', () => {
  const found = html('<p-button label="Guardar"></p-button><p-table [value]="rows"></p-table><p-timeline></p-timeline><p-select></p-select><input pInputText type="text" /><textarea pTextarea></textarea>');

  assert.deepEqual(found, {});
});

test('un input o un textarea sin la directiva de PrimeNG se cuenta', () => {
  const found = html('<input type="text" /><textarea rows="3"></textarea>');

  assert.equal(found['<input> sin directiva de PrimeNG'], 1);
  assert.equal(found['<textarea> sin pTextarea'], 1);
});

test('los inputs de fecha, número, casilla, opción y archivo se cuentan aparte', () => {
  const found = html('<input type="date" /><input type="number" /><input type="checkbox" /><input type="radio" /><input type="file" />');

  assert.equal(found['input nativo de fecha, número, casilla, opción o archivo'], 5);
  assert.equal(found['<input> sin directiva de PrimeNG'], undefined);
});

test('un input oculto no se cuenta', () => {
  assert.deepEqual(html('<input type="hidden" name="a" />'), {});
});

test('las etiquetas y los módulos obsoletos se cuentan', () => {
  assert.equal(html('<p-calendar></p-calendar><p-dropdown></p-dropdown><p-tabView></p-tabView><p-overlayPanel></p-overlayPanel>')['etiqueta obsoleta de PrimeNG'], 4);
  assert.equal(scanFile('x.component.ts', "import { CalendarModule } from 'primeng/calendar';\nimport { TabViewModule } from 'primeng/tabview';")['módulo obsoleto de PrimeNG'], 2);
});

test('el módulo obsoleto solo se busca en el código, no en una plantilla html', () => {
  assert.deepEqual(html("from 'primeng/calendar'"), {});
});

test('en un .ts se revisa solo la plantilla en línea', () => {
  const ts = "const nota = '<ul>no cuenta</ul>';\n@Component({ template: `<ul><li>x</li></ul><p-button></p-button>` })\nclass A {}";

  assert.deepEqual(scanFile('x.component.ts', ts), { '<ul> nativo': 1 });
});

test('una línea con primeng-ok exime el uso de esa línea y de la siguiente', () => {
  assert.deepEqual(html('<!-- primeng-ok: lista de solo lectura de un tercero -->\n<ul><li>x</li></ul>'), {});
  assert.deepEqual(html('<ul><li>x</li></ul> <!-- primeng-ok: motivo -->'), {});
  assert.equal(html('<!-- primeng-ok: motivo -->\n<p-button></p-button>\n<ul></ul>')['<ul> nativo'], 1);
});
