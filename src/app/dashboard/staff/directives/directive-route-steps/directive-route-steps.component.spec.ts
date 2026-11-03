import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectiveRoute } from '../../../../services/directives.service';
import { holder, route } from '../testing/directive-fixtures';
import { DirectiveRouteStepsComponent } from './directive-route-steps.component';

describe('DirectiveRouteStepsComponent', () => {
  let fixture: ComponentFixture<DirectiveRouteStepsComponent>;

  const html = () => fixture.nativeElement as HTMLElement;
  const steps = () => Array.from(html().querySelectorAll('[data-testid="route-step"]'));

  function show(current: DirectiveRoute | null, loading = false, error = '') {
    fixture = TestBed.createComponent(DirectiveRouteStepsComponent);
    fixture.componentRef.setInput('route', current);
    fixture.componentRef.setInput('loading', loading);
    fixture.componentRef.setInput('error', error);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DirectiveRouteStepsComponent], providers: [provideNoopAnimations()] }).compileComponents();
  });

  it('shows each office with the person Core designated, the written title and the resolution', () => {
    show(route());

    expect(steps().length).toBe(5);
    expect(steps()[0].textContent).toContain('Ana Torres');
    expect(steps()[0].textContent).toContain('Jefe de la Oficina');
    expect(steps()[0].textContent).toContain('Resolución 014-2026');
    expect(steps()[2].textContent).toContain('Encargado');
  });

  it('marks the quality office as omitted when the directive is not of a quality process', () => {
    show(route());

    expect(steps()[1].textContent).toContain('Omitida');
    expect(steps()[1].textContent).toContain('no es de un proceso de calidad');
  });

  it('says which office has nobody and blocks the send', () => {
    show(route());

    expect(steps()[3].querySelector('[data-testid="route-missing"]')?.textContent).toContain('Sin persona designada en Core');
    expect(steps()[3].textContent).toContain('Falta');
    expect(html().querySelector('[data-testid="route-blocked"]')?.textContent).toContain('Core no tiene a nadie designado en una oficina');
  });

  it('does not warn when every office has its person', () => {
    show(route({
      can_send: true, issues: [],
      steps: route().steps.map(step => (step.holder === null && !step.skipped ? { ...step, holder: holder('Mario Huamán') } : step)),
    }));

    expect(html().querySelector('[data-testid="route-blocked"]')).toBeNull();
    expect(html().textContent).toContain('Mario Huamán');
  });

  it('tells who comes next when a substitute is scheduled', () => {
    const base = route();
    show({ ...base, steps: [{ ...base.steps[0], next: { ...holder('Marta Condori', 'encargado'), starts_at: '2026-12-15T05:00:00Z' } }, ...base.steps.slice(1)] });

    expect(steps()[0].textContent).toContain('Después: Marta Condori');
  });

  it('shows the skeleton while Core is asked and the error when it fails', () => {
    show(null, true);
    expect(html().querySelector('[data-testid="route-skeleton"]')).not.toBeNull();

    show(null, false, 'No se pudo consultar a Core.');
    expect(html().querySelector('[data-testid="route-error"]')?.textContent).toContain('No se pudo consultar a Core');
    expect(steps().length).toBe(0);
  });
});
