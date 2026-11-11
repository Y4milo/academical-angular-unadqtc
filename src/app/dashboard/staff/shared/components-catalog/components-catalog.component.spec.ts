import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { InstitutionalPreset } from '../../../../app.config';
import { DBU_STATUS_VIEW, STATE_SEVERITY, THEME_TOKENS, TYPE_SCALE, WEIGHT_SCALE } from '../../../../shared/ui/ui-tokens';
import { DATA_GUIDE, FEEDBACK_GUIDE, NAV_GUIDE, OVERLAY_GUIDE } from './catalog-guides';
import { SCREEN_RECIPES } from './catalog-recipes';
import { ACTION_GUIDE, auditRules, CATALOG_SECTIONS, ComponentsCatalogComponent, FORM_GUIDE } from './components-catalog.component';

describe('ComponentsCatalogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentsCatalogComponent],
      providers: [provideHttpClient(), provideRouter([]), MessageService, provideNoopAnimations(), providePrimeNG({ theme: { preset: InstitutionalPreset, options: { darkModeSelector: '.app-dark' } } })],
    }).compileComponents();
  });

  afterEach(() => document.documentElement.classList.remove('app-dark'));

  it('renders every section of the catalog and settles', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const section of CATALOG_SECTIONS.map(item => item.label)) {
      expect(text).toContain(section);
    }
  });

  it('documents the sidebar menu pattern', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    Array.from(root.querySelectorAll<HTMLElement>('p-tab')).find(tab => tab.textContent?.includes('Patrones'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const note = root.querySelector('[data-testid="sidebar-pattern"]');
    expect(note?.textContent).toContain('p-panelmenu');
  });

  it('documents the student menu, the date and number fields and the module patterns', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const open = async (name: string) => {
      Array.from(root.querySelectorAll<HTMLElement>('p-tab')).find(tab => tab.textContent?.includes(name))?.click();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    await open('Formularios');
    expect(root.querySelector('[data-testid="field-pattern"]')?.textContent).toContain('p-datepicker');
    expect(root.querySelector('[data-testid="field-pattern"]')?.textContent).toContain('p-inputnumber');

    await open('Patrones');
    expect(root.querySelector('[data-testid="student-menu-pattern"]')?.textContent).toContain('audience="student"');
  });

  it('has no native list, table, button or bare field of its own in any section', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    for (const section of CATALOG_SECTIONS) {
      Array.from(root.querySelectorAll<HTMLElement>('p-tab')).find(tab => tab.textContent?.includes(section.label))?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const panel = root.querySelector<HTMLElement>(`p-tabpanel[ng-reflect-value="${section.value}"]`) ?? root;
      expect(panel.querySelectorAll('ul:not([class*="p-"]):not([role])').length).withContext(section.label).toBe(0);
    }
    // Lo que PrimeNG renderiza por dentro (tabla, botones) lleva sus clases; lo propio del catálogo no usa etiquetas sueltas.
    expect(root.querySelectorAll('app-components-catalog > .catalog > :not(header):not(p-tabs)').length).toBe(0);
  });

  it('lists a PrimeNG component and what not to use for every action and field', () => {
    for (const row of [...ACTION_GUIDE, ...FORM_GUIDE, ...DATA_GUIDE, ...NAV_GUIDE, ...OVERLAY_GUIDE, ...FEEDBACK_GUIDE]) {
      expect(row.need).not.toBe('');
      expect(row.component).toMatch(/p-|pInputText|pTextarea|pTooltip|routerLink|Texto/);
      expect(row.avoid).not.toBe('');
    }
    expect(FORM_GUIDE.map(row => row.component).join(' ')).toContain('p-fileupload');
  });

  it('has the 12 screen recipes, each with only PrimeNG components, rules and real screens', () => {
    expect(SCREEN_RECIPES.length).toBe(12);
    for (const recipe of SCREEN_RECIPES) {
      expect(recipe.components.length).withContext(recipe.id).toBeGreaterThan(0);
      expect(recipe.components.every(name => /^p-|^pInputText$|^pTextarea$/.test(name))).withContext(recipe.id).toBeTrue();
      expect(recipe.rules.length).withContext(recipe.id).toBeGreaterThan(0);
      expect(recipe.screens).not.toBe('');
    }
  });

  it('audits the old front from the verifier baseline and totals match', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.auditFiles.length).toBeGreaterThan(0);
    expect(component.auditTotal).toBe(component.auditFiles.reduce((sum, row) => sum + row.uses, 0));
    expect(auditRules({ 'a.html': { '<ul> nativo': 2 }, 'b.html': { '<ul> nativo': 1, '<table> nativo': 1 } })).toEqual([
      { rule: '<ul> nativo', uses: 3, files: 2 },
      { rule: '<table> nativo', uses: 1, files: 1 },
    ]);
  });

  it('reads every theme token and leaves the theme as it was', () => {
    document.documentElement.classList.add('app-dark');
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.tokenRows().length).toBe(THEME_TOKENS.length);
    expect(document.documentElement.classList.contains('app-dark')).toBeTrue();
  });

  it('finds every token that must follow the theme defined and different in light and dark', () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.detectChanges();

    // Si un token no existe o no cambia con el tema, la pantalla que lo use queda mitad clara en uno de los dos temas.
    const broken = fixture.componentInstance.tokenRows().filter(row => !row.ok).map(row => row.token.name);
    expect(broken).toEqual([]);
  });

  it('reads every typography token from styles.css with the three allowed weights', () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.detectChanges();

    // Un token ausente o con otro peso significa que la escala del menú y la de PrimeNG ya no coinciden.
    const rows = [...fixture.componentInstance.typeRows(), ...fixture.componentInstance.weightRows()];
    expect(rows.filter(row => !row.ok).map(row => row.token.token)).toEqual([]);
    expect(rows.length).toBe(TYPE_SCALE.length + WEIGHT_SCALE.length);
  });

  it('keeps room around the text of every tag, set once in the preset', () => {
    const padding = (InstitutionalPreset as any).components.tag.root.padding as string;

    // Un recuadro de texto (etiqueta, estado) sin aire alrededor se ve cortado; el aire se define aquí y no pantalla por pantalla.
    expect(padding).toBe('0.375rem 0.75rem');
  });

  it('gives each Bienestar status a color of the shared vocabulary', () => {
    const kinds = Object.values(DBU_STATUS_VIEW).map(view => view.kind);

    expect(kinds.every(kind => kind in STATE_SEVERITY)).toBeTrue();
    expect(DBU_STATUS_VIEW['no_show'].kind).toBe('failed');
    expect(DBU_STATUS_VIEW['cancelled'].kind).toBe('neutral');
  });

  it('documents the standard table padding (12 px by 16 px) and the preset gives it to every table size', async () => {
    const cell = '$$var(--space-3) var(--space-4)'.replace('$$', '');
    const datatable = (InstitutionalPreset as { components?: { datatable?: Record<string, { padding?: string; sm?: { padding?: string } }> } }).components?.datatable;
    for (const part of ['headerCell', 'bodyCell', 'footerCell']) {
      expect(datatable?.[part]?.padding).withContext(part).toBe(cell);
      expect(datatable?.[part]?.sm?.padding).withContext(`${part} sm`).toBe(cell);
    }

    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    Array.from(root.querySelectorAll<HTMLElement>('p-tab')).find(tab => tab.textContent?.includes('Datos'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root.querySelector('[data-testid="table-padding-note"]')?.textContent).toContain('12 px arriba y abajo y 16 px a los lados');
    expect(root.querySelector('[data-testid="table-padding-sample"] p-button')).not.toBeNull();
    expect(DATA_GUIDE.map(row => row.need).join(' ')).toContain('Relleno de las celdas de una tabla');
  });

  it('documents the standard card padding (24 px, 16 px on phones) and the preset gives it to every card', async () => {
    const card = (InstitutionalPreset as { components?: { card?: { body?: { padding?: string; gap?: string } } } }).components?.card?.body;
    expect(card?.padding).toBe('var(--space-5)');
    expect(card?.gap).toBe('var(--space-4)');

    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    Array.from(root.querySelectorAll<HTMLElement>('p-tab')).find(tab => tab.textContent?.includes('Datos'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root.querySelector('[data-testid="card-padding-note"]')?.textContent).toContain('24 px de relleno');
    expect(root.querySelectorAll('[data-testid="card-padding-sample"] p-card').length).toBe(2);
    expect(DATA_GUIDE.map(row => row.need).join(' ')).toContain('Relleno de un card');
  });

  it('lists the components of the document screens: state banner, signature progress, actions menu, technical details and the sticky bar', () => {
    expect(FEEDBACK_GUIDE.map(row => row.need).join(' ')).toContain('Banner del estado de un documento');
    expect(DATA_GUIDE.map(row => row.component).join(' ')).toContain('p-timeline layout="horizontal"');
    expect(DATA_GUIDE.map(row => row.component).join(' ')).toContain('p-panel [toggleable]');
    expect(ACTION_GUIDE.map(row => row.component).join(' ')).toContain('p-menu popup «Más acciones»');
    expect(ACTION_GUIDE.map(row => row.component).join(' ')).toContain('p-toolbar');
  });
});
