import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { InstitutionalPreset } from '../../../../app.config';
import { DBU_STATUS_VIEW, STATE_SEVERITY, THEME_TOKENS, TYPE_SCALE, WEIGHT_SCALE } from '../../../../shared/ui/ui-tokens';
import { ComponentsCatalogComponent } from './components-catalog.component';

describe('ComponentsCatalogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentsCatalogComponent],
      providers: [provideNoopAnimations(), providePrimeNG({ theme: { preset: InstitutionalPreset, options: { darkModeSelector: '.app-dark' } } })],
    }).compileComponents();
  });

  afterEach(() => document.documentElement.classList.remove('app-dark'));

  it('renders every section of the catalog and settles', async () => {
    const fixture = TestBed.createComponent(ComponentsCatalogComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    for (const section of ['Tema claro y oscuro', 'Escalas', 'Componentes', 'Estados', 'Patrones']) {
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

  it('gives each Bienestar status a color of the shared vocabulary', () => {
    const kinds = Object.values(DBU_STATUS_VIEW).map(view => view.kind);

    expect(kinds.every(kind => kind in STATE_SEVERITY)).toBeTrue();
    expect(DBU_STATUS_VIEW['no_show'].kind).toBe('failed');
    expect(DBU_STATUS_VIEW['cancelled'].kind).toBe('neutral');
  });
});
