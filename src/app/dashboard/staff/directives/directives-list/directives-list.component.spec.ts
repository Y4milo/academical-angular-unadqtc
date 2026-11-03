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

  async function create() {
    fixture = TestBed.createComponent(DirectivesListComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['access', 'list']);
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
    expect(html().querySelector('[data-testid="directives-empty"]')?.textContent).toContain('Ninguna directiva en este estado');
  });

  it('invites to upload the first one when there are none', async () => {
    service.list.and.returnValue(of(ok([])));
    await create();

    expect(html().querySelector('[data-testid="directives-empty"]')?.textContent).toContain('Sube tu primera directiva');
  });

  it('explains that Core does not authorize requesting, and does not ask for the list', async () => {
    service.access.and.returnValue(of(ok({ ...access, can_request: false, request_units: [], can_sign: true, sign_units: ['oaj'] })));
    await create();

    expect(html().querySelector('[data-testid="no-request-access"]')?.textContent).toContain('Core no te autoriza a pedir directivas');
    expect(service.list).not.toHaveBeenCalled();
  });

  it('shows the error with a way to retry', async () => {
    service.access.and.returnValue(throwError(() => ({ status: 503 })));
    await create();

    expect(html().querySelector('[data-testid="load-error"]')?.textContent).toContain('No se pudieron consultar las directivas');

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

    expect(navigate.calls.allArgs()).toEqual([['directivas/8'], ['directivas/nueva']]);
  });
});
