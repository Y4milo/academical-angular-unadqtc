import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { access, ok, summary } from '../testing/directive-fixtures';
import { DirectivesListComponent } from './directives-list.component';

describe('DirectivesListComponent', () => {
  let fixture: ComponentFixture<DirectivesListComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let router: Router;

  const html = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(html().querySelectorAll('[data-testid="directive-row"]'));
  /** Los filtros viven en un diálogo de PrimeNG que se pega al `body`: se abre y se busca ahí. */
  const openFilters = async () => {
    fixture.componentInstance.filtersOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const inDialog = (selector: string) => Array.from(document.body.querySelectorAll(selector));

  async function create() {
    fixture = TestBed.createComponent(DirectivesListComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['access', 'list', 'pending', 'participating']);
    service.pending.and.returnValue(of(ok([])));
    service.participating.and.returnValue(of(ok([])));
    service.access.and.returnValue(of(ok(access)));
    service.list.and.returnValue(of(ok([summary(), summary({ id: 8, title: 'Directiva de viáticos', status: 'in_signature', status_label: 'En firma' })])));
    await TestBed.configureTestingModule({
      imports: [DirectivesListComponent],
      providers: [provideRouter([]), provideNoopAnimations(), { provide: DirectivesService, useValue: service }, { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['notifyApiData', 'error']) }],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('shows the shape of the table while it loads', async () => {
    service.access.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(rows().length).toBe(0);
  });

  it('lists the directives with their state and office', async () => {
    await create();

    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Directiva para el control de bienes patrimoniales');
    expect(rows()[0].textContent).toContain('Oficina de Administración');
    expect(rows()[0].textContent).toContain('14 páginas');
    expect(html().querySelectorAll('[data-testid="directive-status"]')[1].textContent).toContain('En firma');
  });

  it('filters by state and says so when none matches', async () => {
    await create();
    fixture.componentInstance.filter.set('in_signature');
    fixture.detectChanges();

    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Directiva de viáticos');

    fixture.componentInstance.filter.set('signed');
    fixture.detectChanges();
    expect(html().querySelector('[data-testid="directives-empty"]')?.textContent).toContain('Ningún documento en este estado');
  });

  it('invites to upload the first one when there are none', async () => {
    service.list.and.returnValue(of(ok([])));
    await create();

    expect(html().querySelector('[data-testid="directives-empty"]')?.textContent).toContain('Aún no tienes documentos de gestión');
  });

  it('explains that Core authorizes neither requesting nor signing, and does not ask for anything else', async () => {
    service.access.and.returnValue(of(ok({ ...access, can_request: false, request_units: [] })));
    await create();

    expect(html().querySelector('[data-testid="no-request-access"]')?.textContent).toContain('Core no te autoriza a pedir ni a firmar documentos');
    expect(service.list).not.toHaveBeenCalled();
    expect(service.pending).not.toHaveBeenCalled();
  });

  it('a signer who cannot request goes straight to what is waiting for the signature', async () => {
    service.access.and.returnValue(of(ok({ ...access, can_request: false, request_units: [], can_sign: true, sign_units: ['oaj'] })));
    service.pending.and.returnValue(of(ok([{ ...summary({ id: 9, status: 'in_signature', status_label: 'En firma' }), step: { label: 'Asesoría Jurídica', position: 2, total: 4 } }])));
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await create();

    expect(service.list).not.toHaveBeenCalled();
    expect(html().querySelectorAll('[data-testid="pending-row"]').length).toBe(1);
    expect(html().querySelector('[data-testid="pending-row"]')?.textContent).toContain('Paso 2 de 4');
    (html().querySelector('[data-testid="sign-pending"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/9/firmar');
  });

  it('who also requests can switch between their directives and what waits for their signature, and an empty inbox says so', async () => {
    service.access.and.returnValue(of(ok({ ...access, can_sign: true, sign_units: ['adm'] })));
    await create();

    expect(html().querySelector('[data-testid="section-switch"]')).not.toBeNull();
    expect(rows().length).toBe(2);

    fixture.componentInstance.section.set('pending');
    fixture.detectChanges();
    expect(html().querySelector('[data-testid="pending-empty"]')?.textContent).toContain('No tienes firmas pendientes');
  });

  it('offers the directives of the route as a consultation section only when the person is in one', async () => {
    await create();
    expect(html().querySelector('[data-testid="section-switch"]')).toBeNull();

    service.participating.and.returnValue(of(ok([summary({ id: 12, title: 'Directiva de viáticos', status: 'returned', status_label: 'Devuelta', can_edit: false })])));
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(html().querySelector('[data-testid="section-switch"]')?.textContent).toContain('En tu ruta');

    fixture.componentInstance.section.set('route');
    fixture.detectChanges();
    expect(html().querySelectorAll('[data-testid="route-row"]').length).toBe(1);
    expect(html().querySelector('[data-testid="route-row"]')?.textContent).toContain('Devuelto');
    (html().querySelector('[data-testid="open-route"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/12');
  });

  it('shows the error with a way to retry', async () => {
    service.access.and.returnValue(throwError(() => ({ status: 503 })));
    await create();

    expect(html().querySelector('[data-testid="load-error"]')?.textContent).toContain('No se pudieron consultar los documentos');

    service.access.and.returnValue(of(ok(access)));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(rows().length).toBe(2);
  });

  it('opens a directive and goes to create a new one', async () => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await create();

    fixture.componentInstance.open(summary({ id: 8 }));
    fixture.componentInstance.create();

    expect(navigate.calls.allArgs()).toEqual([['documentos-de-gestion/8'], ['documentos-de-gestion/nueva']]);
  });
  const gestion = { code: 'gestion_institucional', label: 'Documentos de gestión institucional' };
  const plans = [
    summary({ id: 1, title: 'Una directiva de prueba' }),
    summary({ id: 2, title: 'Plan operativo anual', document_type: gestion, document_subtype: { code: 'poi', label: 'POI' } }),
    summary({ id: 3, title: 'Estatuto de la universidad', document_type: gestion, document_subtype: { code: 'estatuto', label: 'Estatuto' } }),
    summary({ id: 4, title: 'Reglamento de prácticas', document_type: { code: 'reglamentos', label: 'Reglamentos' } }),
  ];
  const typeLabels = () => inDialog('[data-testid="type-filter"] .p-togglebutton').map(button => button.textContent?.trim());

  it('shows the type of each document in its own column, with the subtype when it has one', async () => {
    service.list.and.returnValue(of(ok(plans)));
    await create();

    expect(Array.from(html().querySelectorAll('[data-testid="directive-type"]')).map(cell => cell.textContent?.trim())).toEqual([
      'Directivas', 'Documentos de gestión institucional · POI', 'Documentos de gestión institucional · Estatuto', 'Reglamentos',
    ]);
  });

  it('offers the types that are in the list with how many there are, and filters by the one chosen', async () => {
    service.list.and.returnValue(of(ok(plans)));
    await create();
    await openFilters();

    expect(typeLabels()).toEqual(['Todos (4)', 'Directivas (1)', 'Documentos de gestión institucional (2)', 'Reglamentos (1)']);

    fixture.componentInstance.changeType('reglamentos');
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Reglamento de prácticas');

    fixture.componentInstance.changeType(null);
    fixture.detectChanges();
    expect(rows().length).toBe(4);
  });

  it('offers the subtypes only inside documents de gestión institucional, and filters by them', async () => {
    service.list.and.returnValue(of(ok(plans)));
    await create();
    await openFilters();
    expect(inDialog('[data-testid="subtype-filters"]').length).toBe(0);

    fixture.componentInstance.changeType('gestion_institucional');
    fixture.detectChanges();
    expect(inDialog('[data-testid="subtype-filter"] .p-togglebutton').map(button => button.textContent?.trim())).toEqual(['Todos los subtipos', 'POI (1)', 'Estatuto (1)']);

    fixture.componentInstance.subtypeFilter.set('poi');
    fixture.detectChanges();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Plan operativo anual');

    fixture.componentInstance.changeType('reglamentos');
    fixture.detectChanges();
    expect(fixture.componentInstance.subtypeFilter()).toBeNull();
  });

  it('does not offer a type filter when everything is of the same type', async () => {
    await create();
    await openFilters();

    expect(inDialog('[data-testid="type-filters"]').length).toBe(0);
  });
  describe('search, applied filters and phone cards', () => {
    it('searches by title, office or type and says when nothing matches', async () => {
      service.list.and.returnValue(of(ok(plans)));
      await create();

      fixture.componentInstance.search.set('estatuto');
      fixture.detectChanges();
      expect(rows().length).toBe(1);
      expect(rows()[0].textContent).toContain('Estatuto de la universidad');

      fixture.componentInstance.search.set('no existe');
      fixture.detectChanges();
      expect(html().querySelector('[data-testid="directives-empty"]')?.textContent).toContain('Ningún documento coincide con tu búsqueda');
    });

    it('shows what is applied as chips that can be removed one by one or all together', async () => {
      service.list.and.returnValue(of(ok(plans)));
      await create();
      expect(html().querySelector('[data-testid="active-filters"]')).toBeNull();

      fixture.componentInstance.filter.set('draft');
      fixture.componentInstance.changeType('reglamentos');
      fixture.detectChanges();
      const chips = () => Array.from(html().querySelectorAll('[data-testid="active-filters"] p-chip')).map(chip => chip.textContent?.trim());
      expect(chips()).toEqual(['Estado: Borrador', 'Tipo: Reglamentos']);

      fixture.componentInstance.removeFilter('status');
      fixture.detectChanges();
      expect(chips()).toEqual(['Tipo: Reglamentos']);

      (html().querySelector('[data-testid="clear-filters"] button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(html().querySelector('[data-testid="active-filters"]')).toBeNull();
      expect(rows().length).toBe(4);
    });

    it('shows how many offices signed and which one has the turn when the API says so', async () => {
      service.list.and.returnValue(of(ok([summary({ id: 3, status: 'in_signature', status_label: 'En firma', route_progress: { signed: 1, total: 4, active_office: 'Oficina de Asesoría Jurídica' } })])));
      await create();

      expect(rows()[0].textContent).toContain('Oficina de Asesoría Jurídica');
      expect(rows()[0].querySelectorAll('.progress i').length).toBe(4);
      expect(rows()[0].querySelectorAll('.progress i.progress__done').length).toBe(1);
      expect(rows()[0].querySelectorAll('.progress i.progress__now').length).toBe(1);
    });

    it('opens the document when the row is clicked', async () => {
      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      await create();

      (rows()[0] as HTMLElement).click();
      expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/7');
    });

    it('draws a card per document on a phone, with the same test ids', async () => {
      service.list.and.returnValue(of(ok(plans)));
      await create();
      fixture.componentInstance.isMobile.set(true);
      fixture.detectChanges();

      expect(html().querySelector('table')).toBeNull();
      expect(rows().length).toBe(4);
      expect(rows()[0].classList.contains('row-card')).toBeTrue();
    });
  });

  it('shows the role of the person in each pending document and names the button after it', async () => {
    service.access.and.returnValue(of(ok({ ...access, can_request: false, request_units: [], can_sign: true, sign_units: ['oaj'] })));
    service.pending.and.returnValue(of(ok([{ ...summary({ id: 9, status: 'in_signature', status_label: 'En firma' }), step: { label: 'Asesoría Jurídica', position: 2, total: 4, role: 'visto_bueno' as const, role_label: 'Visto bueno' } }])));
    await create();

    expect(html().querySelector('[data-testid="pending-role"]')?.textContent).toContain('Visto bueno');
    expect(html().querySelector('[data-testid="sign-pending"]')?.textContent).toContain('Dar visto bueno');
  });
});
