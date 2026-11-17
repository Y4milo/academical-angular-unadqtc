import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AccountValidationService, ValidationCase, ValidationSummary } from '../../../../services/account-validation.service';
import { AccountValidationComponent } from './account-validation.component';

const proof = (overrides = {}) => ({ verified_at: '2026-10-02T08:00:00-05:00', source: 'decolecta_external_core', source_label: 'Decolecta, con Core externo como complemento', trusted: true, ...overrides });

const duplicate: ValidationCase = {
  id: 1, type: 'possible_duplicate', strength: 'high', detected_at: '2026-11-17T01:35:00-05:00',
  core: { person_id: 2, name: 'CARLOS MENDOZA HUAMÁN', document: '23456781', profile_type: 'teacher', email: 'cmendoza@unadqtc.edu.pe', identity: proof() },
  academical: { staff_id: 7, name: 'Carlos Mendoza Huaman', document: '73456781', email: null, user: { id: 9, nick: '73456781', last_login_at: null, linked: false } },
  same_document: false, same_name: true, can_confirm: true, confirm_blocked_reason: null, can_create: true, can_unlink: false,
};

const mismatch: ValidationCase = {
  id: 2, type: 'name_mismatch', strength: 'high', detected_at: '2026-11-17T01:35:00-05:00',
  core: { person_id: 3, name: 'DEIVIS CASTRO PARI', document: '11111111', profile_type: 'administrative', email: null, identity: proof({ trusted: false, source: 'user_onboarding', source_label: 'Alta hecha por la propia persona' }) },
  academical: { staff_id: 8, name: 'Deivy Castro Pari', document: '11111111', email: null, user: { id: 10, nick: '11111111', last_login_at: '2026-10-12T08:14:00-05:00', linked: true } },
  same_document: true, same_name: false, can_confirm: true, confirm_blocked_reason: null, can_create: false, can_unlink: true,
};

const summary = (cases: ValidationCase[]): ValidationSummary => ({ counts: { to_decide: cases.length, to_create: 2, without_core: 3, resolved: 5 }, cases });

describe('AccountValidationComponent', () => {
  const service = {
    summary: jasmine.createSpy('summary'),
    toCreate: jasmine.createSpy('toCreate'),
    withoutCore: jasmine.createSpy('withoutCore'),
    confirm: jasmine.createSpy('confirm'),
    createAccount: jasmine.createSpy('createAccount'),
    unlink: jasmine.createSpy('unlink'),
    createMany: jasmine.createSpy('createMany'),
    suspendWithoutCore: jasmine.createSpy('suspendWithoutCore'),
    detect: jasmine.createSpy('detect'),
  };

  beforeEach(() => Object.values(service).forEach(spy => spy.calls.reset()));

  function create(cases: ValidationCase[] = [duplicate, mismatch]) {
    service.summary.and.returnValue(of({ status: 'success', payload: { data: summary(cases) } } as never));
    service.toCreate.and.returnValue(of({ status: 'success', payload: { data: [
      { core_person_id: 11, name: 'MYRIAM LEIVA ALVAREZ', profile_type: 'teacher', dependency: null, blocked_reason: null },
      { core_person_id: 12, name: 'JULIO DURAND CHACON', profile_type: 'administrative', dependency: null, blocked_reason: 'En validación: hay una persona con el mismo nombre en Academical.' },
    ] } } as never));
    service.withoutCore.and.returnValue(of({ status: 'success', payload: { data: {
      to_suspend: [{ id: 1, nick: '10000001', name: 'Ana Uno Dos', last_login_at: null }],
      blocked: [{ id: 2, nick: '10000003', name: 'Cris Cinco Seis', last_login_at: null, reason: 'Es administrador y no quedaría otro administrador activo.' }],
    } } } as never));

    TestBed.configureTestingModule({
      imports: [AccountValidationComponent],
      providers: [MessageService, { provide: AccountValidationService, useValue: service }],
    });
    const fixture = TestBed.createComponent(AccountValidationComponent);
    fixture.detectChanges();
    return fixture;
  }

  const text = (fixture: { nativeElement: unknown }): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('warns that cases wait for a decision and draws Core and Academical side by side with the real identity source', () => {
    const fixture = create();

    expect(text(fixture)).toContain('2 casos esperan una decisión');
    expect(text(fixture)).toContain('Posible duplicado');
    expect(text(fixture)).toContain('Mismo documento, nombre distinto');
    expect(text(fixture)).toContain('CARLOS MENDOZA HUAMÁN');
    expect(text(fixture)).toContain('Carlos Mendoza Huaman');
    expect(text(fixture)).toContain('Decolecta, con Core externo como complemento');
    expect(text(fixture)).toContain('Alta hecha por la propia persona');
  });

  it('shows why the document cannot be corrected and disables the link button', () => {
    const blocked: ValidationCase = { ...duplicate, can_confirm: false, confirm_blocked_reason: 'Core todavía no verificó su identidad.' };
    const fixture = create([blocked]);

    expect(text(fixture)).toContain('No se puede corregir el documento: Core todavía no verificó su identidad.');
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    expect(buttons.find(button => button.textContent?.includes('Es la misma persona'))?.disabled).toBeTrue();
  });

  it('confirms the case through the API and reloads the list', () => {
    const fixture = create();
    service.confirm.and.returnValue(of({ status: 'success', payload: { title: 'Cuenta vinculada', message: '' } } as never));

    fixture.componentInstance.open('confirm', duplicate);
    fixture.componentInstance.confirm();

    expect(service.confirm).toHaveBeenCalledOnceWith(1);
    expect(service.summary).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.dialogOpen).toBeFalse();
  });

  it('keeps the dialog open when the API refuses the decision', () => {
    const fixture = create();
    service.confirm.calls.reset();
    service.confirm.and.returnValue(of({ status: 'warning', payload: { title: 'No se pudo completar', message: 'Core todavía no verificó la identidad.' } } as never));

    fixture.componentInstance.open('confirm', duplicate);
    fixture.componentInstance.confirm();

    expect(fixture.componentInstance.dialogOpen).toBeTrue();
  });

  it('lists the people to create with the reason when one cannot be created and only lets the creatable ones be selected', () => {
    const fixture = create();
    fixture.componentInstance.tab.set('create');
    fixture.detectChanges();

    expect(text(fixture)).toContain('MYRIAM LEIVA ALVAREZ');
    expect(text(fixture)).toContain('No se puede crear');
    expect(text(fixture)).toContain('En validación: hay una persona con el mismo nombre');
    expect(fixture.componentInstance.creatable().length).toBe(1);
  });

  it('shows who would be suspended and who is protected, and suspends only after confirming', () => {
    const fixture = create();
    fixture.componentInstance.tab.set('without-core');
    fixture.detectChanges();

    expect(text(fixture)).toContain('Se suspende');
    expect(text(fixture)).toContain('Es administrador y no quedaría otro administrador activo.');

    service.suspendWithoutCore.and.returnValue(of({ status: 'success', payload: { title: 'Usuarios suspendidos', message: '' } } as never));
    fixture.componentInstance.openSuspend();
    expect(service.suspendWithoutCore).not.toHaveBeenCalled();
    fixture.componentInstance.confirm();
    expect(service.suspendWithoutCore).toHaveBeenCalledTimes(1);
  });

  it('updates from Core before reviewing, tells the result and reloads the cases', () => {
    const fixture = create();
    service.detect.and.returnValue(of({ status: 'success', payload: { title: 'Actualizado desde Core', message: '2 casos esperan una decisión.' } } as never));
    service.summary.calls.reset();

    fixture.componentInstance.refresh();

    expect(service.detect).toHaveBeenCalledTimes(1);
    expect(service.summary).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.refreshing()).toBeFalse();
  });

  it('offers the update from Core in every case and in the header', () => {
    const fixture = create();

    const labels = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).map(button => button.textContent?.trim());
    expect(labels.filter(label => label === 'Actualizar desde Core').length).toBe(3);
  });

  it('says there is nothing to decide when documents and names match everywhere', () => {
    const fixture = create([]);

    expect(text(fixture)).toContain('No hay casos por decidir');
  });

  it('shows an error with a retry when the validation cannot be loaded', () => {
    service.summary.and.returnValue(throwError(() => new Error('offline')) as never);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [AccountValidationComponent], providers: [MessageService, { provide: AccountValidationService, useValue: service }] });
    const fixture = TestBed.createComponent(AccountValidationComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    expect(text(fixture)).toContain('No se pudo cargar la validación');
  });
});
