import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../../../services/notification.service';
import { CaseActionResponse, UserCase, UserCasesPage, UserCasesService } from '../../../../services/user-cases.service';
import { UserCasesComponent } from './user-cases.component';

const base: UserCase = {
  id: 1, user_id: 10, nick: 'docente.a', display_name: 'Docente A', account_kind: 'person', role: 'Docente', user_status: 'Activo', last_login_at: null,
  code: 'not_linked', status: 'open', suggested_action: 'suspend', detail: 'Sin vínculo con una persona de Core.', detected_at: '2026-10-26 02:00:00',
  postponed_until: null, resolved_at: null, resolution: null, note: null, managed_by: null,
};

const cases: UserCase[] = [
  base,
  { ...base, id: 2, user_id: 11, nick: 'adgaa', display_name: 'Asistente DGGA', code: 'functional_without_holder', suggested_action: 'assign_holder', detail: 'La cuenta funcional no tiene titular vigente.' },
];

const page: UserCasesPage = { cases, total: 2, page: 1, per_page: 25, summary: { by_status: { open: 2 }, open_by_code: { not_linked: 1, functional_without_holder: 1 } } };

const preview: CaseActionResponse = {
  dry_run: true,
  summary: { applied: 0, would_apply: 1, skipped: 1 },
  results: [
    { case_id: 1, user_id: 10, nick: 'docente.a', outcome: 'would_apply', reason: null },
    { case_id: 2, user_id: 11, nick: 'adgaa', outcome: 'skipped', reason: 'Es el último administrador activo.' },
  ],
};

const ok = (data: unknown): never => of({ status: 'success', payload: { data } }) as never;

describe('UserCasesComponent', () => {
  let service: jasmine.SpyObj<UserCasesService>;

  function create(list: never = ok(page)) {
    service = jasmine.createSpyObj<UserCasesService>('UserCasesService', ['list', 'export', 'apply']);
    service.list.and.returnValue(list);
    TestBed.configureTestingModule({
      imports: [UserCasesComponent],
      providers: [
        provideNoopAnimations(),
        { provide: UserCasesService, useValue: service },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
      ],
    });
    const fixture = TestBed.createComponent(UserCasesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('draws the cases with a summary card per kind and asks for the open ones by default', () => {
    const fixture = create();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Docente A');
    expect(text).toContain('Sin vínculo con Core');
    expect(text).toContain('Cuenta funcional sin titular');
    expect(fixture.componentInstance.unresolvedTotal()).toBe(2);
    expect(service.list.calls.mostRecent().args[0]).toEqual({ status: ['open'], code: null, search: '' });
  });

  it('filters by the card clicked and goes back to the first page', () => {
    const fixture = create();

    fixture.componentInstance.setCode('not_linked');

    expect(service.list.calls.mostRecent().args).toEqual([{ status: ['open'], code: 'not_linked', search: '' }, 1, 25]);
    fixture.componentInstance.setCode('not_linked');
    expect(fixture.componentInstance.code()).toBeNull();
  });

  it('shows an error with a retry instead of a blank panel when the cases cannot be loaded', () => {
    const fixture = create(throwError(() => new Error('offline')) as never);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron cargar los casos');
  });

  it('shows an inviting empty state when nothing needs attention', () => {
    const empty: UserCasesPage = { ...page, cases: [], total: 0, summary: { by_status: {}, open_by_code: {} } };
    const fixture = create(ok(empty));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay casos con este filtro');
  });

  it('asks for the reason before keeping or postponing, and for a future date before postponing', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.openDialog([base]);

    component.action = 'keep';
    component.simulate();
    expect(component.formError).toBe('Escribe el motivo.');

    component.action = 'postpone';
    component.note = 'Contrato en trámite';
    component.until = new Date(2000, 0, 1);
    component.simulate();
    expect(component.formError).toBe('Elige una fecha posterior a hoy.');
    expect(service.apply).not.toHaveBeenCalled();
  });

  it('simulates first without reloading, then applies, reloads and closes', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    service.apply.and.returnValues(
      ok(preview),
      ok({ ...preview, dry_run: false, summary: { applied: 1, would_apply: 0, skipped: 1 } }),
    );
    component.openDialog(cases);
    const loads = service.list.calls.count();

    component.simulate();
    expect(service.apply.calls.mostRecent().args).toEqual([[1, 2], { action: 'suspend', note: null, until: null }, true]);
    expect(component.outcome?.summary.skipped).toBe(1);
    expect(component.outcomeText(preview.results[1])).toBe('Es el último administrador activo.');
    expect(service.list.calls.count()).toBe(loads);

    component.confirm();
    expect(service.apply.calls.mostRecent().args[2]).toBeFalse();
    expect(component.dialogVisible).toBeFalse();
    expect(service.list.calls.count()).toBe(loads + 1);
  });

  it('forgets the simulation when the action changes and offers only reopen for resolved cases', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.openDialog([base]);
    component.outcome = preview;

    component.onActionChange();
    expect(component.outcome).toBeNull();

    component.openDialog([{ ...base, status: 'resolved' }]);
    expect(component.actionOptions.map(option => option.value)).toEqual(['reopen']);
  });
});
