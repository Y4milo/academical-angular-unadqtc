import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { NotificationService } from '../../../../services/notification.service';
import { AccountHolders, AccountRow, CorePersonLookup, UserAccountsService } from '../../../../services/user-accounts.service';
import { UserAccountSheetComponent } from './user-account-sheet.component';
import { UserAccountsComponent } from './user-accounts.component';

const inDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const rows: AccountRow[] = [
  { id: 1, nick: 'adgaa', kind: 'functional', display_name: 'Asistente DGGA', role: 'Usuario académico', status: 'Activo', created_at: '2024-03-14 10:00:00', last_login_at: null, holder_state: 'none', holder_valid_to: null },
  { id: 2, nick: 'oti', kind: 'functional', display_name: 'Asistente OTI', role: 'Usuario administrativo', status: 'Activo', created_at: '2024-03-14 10:00:00', last_login_at: null, holder_state: 'current', holder_valid_to: inDays(10) },
  { id: 3, nick: '123456', kind: 'service', display_name: 'Recaudación', role: 'Servicios de API', status: 'Suspendido', created_at: '2024-03-14 10:00:00', last_login_at: null, holder_state: null, holder_valid_to: null },
];

describe('UserAccountsComponent', () => {
  function create(list = of({ status: 'success', payload: { data: rows } } as never)) {
    TestBed.configureTestingModule({
      imports: [UserAccountsComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: UserAccountsService, useValue: { list: () => list } }],
    });
    const fixture = TestBed.createComponent(UserAccountsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('draws the accounts with the holder state of each one and warns about the ones that need attention', () => {
    const fixture = create();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Asistente DGGA');
    expect(text).toContain('Sin titular');
    expect(text).toContain('Por vencer');
    expect(text).toContain('No aplica');
    expect(fixture.componentInstance.needAttention()).toBe(2);
    expect(text).toContain('2 cuentas necesitan atención');
  });

  it('shows an error with a retry instead of a blank panel when the accounts cannot be loaded', () => {
    const fixture = create(throwError(() => new Error('offline')) as never);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadError()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron cargar las cuentas');
  });

  it('shows an inviting empty state when there are no such accounts', () => {
    const fixture = create(of({ status: 'success', payload: { data: [] } } as never));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay cuentas funcionales ni de servicio');
  });
});

describe('UserAccountSheetComponent', () => {
  const holders = (overrides: Partial<AccountHolders> = {}): AccountHolders => ({
    account: { id: 1, nick: 'adgaa', kind: 'functional', display_name: 'Asistente DGGA', role: 'Usuario académico', status: 'Activo', created_at: '2024-03-14 10:00:00', last_login_at: null },
    kind: 'functional',
    holders: [
      { id: 9, core_person_id: 7312, name: 'María Torres Quispe', service_order: 'O/S 0123-2026', valid_from: '2026-03-02', valid_to: inDays(70), closed_at: null, close_reason: null, registered_by: 1, is_current: true, is_expired: false },
      { id: 5, core_person_id: 7000, name: 'Pedro Ruiz Cusi', service_order: 'O/S 0412-2025', valid_from: '2025-05-05', valid_to: '2025-12-31', closed_at: '2026-01-02 09:00:00', close_reason: 'Cambio de titular', registered_by: 1, is_current: false, is_expired: false },
    ],
    ...overrides,
  });

  const service = {
    holders: jasmine.createSpy('holders'),
    lookupPerson: jasmine.createSpy('lookupPerson'),
    assign: jasmine.createSpy('assign'),
    close: jasmine.createSpy('close'),
  };

  function create(data: AccountHolders) {
    service.holders.and.returnValue(of({ status: 'success', payload: { data } }));
    TestBed.configureTestingModule({
      imports: [UserAccountSheetComponent],
      providers: [
        provideNoopAnimations(), provideRouter([]), MessageService,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } } },
        { provide: UserAccountsService, useValue: service },
        { provide: NotificationService, useValue: { notifyApiData: () => undefined } },
      ],
    });
    const fixture = TestBed.createComponent(UserAccountSheetComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the current holder with the service order and keeps the history', () => {
    const fixture = create(holders());
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('María Torres Quispe');
    expect(text).toContain('O/S 0123-2026');
    expect(text).toContain('Pedro Ruiz Cusi');
    expect(text).toContain('Cambio de titular');
    expect(text).toContain('Solo administrador');
  });

  it('says plainly when the account has no current holder and offers to register one', () => {
    const fixture = create(holders({ holders: [] }));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('no tiene titular vigente');
    expect(text).toContain('Registrar titular');
    expect(text).toContain('Aún no hay titulares registrados');
  });

  it('does not break the sheet when Core cannot give the holder name', () => {
    const data = holders();
    data.holders[0].name = null;
    const fixture = create(data);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Nombre no disponible');
    expect(text).toContain('id 7312');
  });

  it('classifies the service order as current, about to expire or expired', () => {
    const fixture = create(holders());
    const component = fixture.componentInstance;
    const base = holders().holders[0];

    expect(component.holderStatus({ ...base, valid_to: inDays(90) }).label).toBe('Vigente');
    expect(component.holderStatus({ ...base, valid_to: inDays(14) }).label).toBe('Por vencer');
    expect(component.holderStatus({ ...base, valid_to: inDays(-3) }).label).toBe('O/S vencida');
    expect(component.holderStatus({ ...base, valid_to: null }).note).toBe('Sin fecha de fin');
  });

  it('only saves after Core confirmed the person and asks for the service order', () => {
    const fixture = create(holders({ holders: [] }));
    const component = fixture.componentInstance;
    const found: CorePersonLookup = { person_id: 7312, full_name: 'María Torres Quispe', is_active: true, is_staff: false };
    service.lookupPerson.and.returnValue(of({ status: 'success', payload: { data: found } }));
    service.assign.and.returnValue(of({ status: 'success', payload: {} }));

    component.openAssign(false);
    component.saveHolder();
    expect(service.assign).not.toHaveBeenCalled();

    component.documentNumber = '45678901';
    component.search();
    expect(component.lookupState).toBe('found');

    component.saveHolder();
    expect(component.serviceOrderError).toBe('Escribe el número de la orden de servicio.');
    expect(service.assign).not.toHaveBeenCalled();

    component.serviceOrder = 'O/S 0123-2026';
    component.saveHolder();
    expect(service.assign).toHaveBeenCalledWith(1, jasmine.objectContaining({ document_number: '45678901', service_order: 'O/S 0123-2026' }));
    expect(component.assignOpen).toBeFalse();
  });

  it('reports a person Core does not have and does not allow saving', () => {
    const fixture = create(holders({ holders: [] }));
    const component = fixture.componentInstance;
    service.lookupPerson.and.returnValue(of({ status: 'success', payload: { data: null } }));
    service.assign.calls.reset();

    component.openAssign(false);
    component.documentNumber = '99999999';
    component.search();
    component.serviceOrder = 'O/S 1';
    component.saveHolder();

    expect(component.lookupState).toBe('missing');
    expect(service.assign).not.toHaveBeenCalled();
  });

  it('closes the holder only with a reason', () => {
    const fixture = create(holders());
    const component = fixture.componentInstance;
    service.close.and.returnValue(of({ status: 'success', payload: {} }));

    component.openClose();
    component.confirmClose();
    expect(component.closeReasonError).toBe('Escribe el motivo del cierre.');
    expect(service.close).not.toHaveBeenCalled();

    component.closeReason = 'Terminó su orden de servicio';
    component.confirmClose();
    expect(service.close).toHaveBeenCalledWith(1, 9, 'Terminó su orden de servicio');
  });
});
