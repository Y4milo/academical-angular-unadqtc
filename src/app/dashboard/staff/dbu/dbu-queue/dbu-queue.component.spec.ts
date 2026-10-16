import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DbuQueueItem, DbuQueueResult, DbuQueueService } from '../../../../services/dbu-queue.service';
import { NotificationService } from '../../../../services/notification.service';
import { DbuQueueComponent } from './dbu-queue.component';
import { dbuDayLabel, dbuQueueErrorMessage } from './dbu-queue.util';

const item = (overrides: Partial<DbuQueueItem> = {}): DbuQueueItem => ({
  id: 1, code: 'CT-4F7K2P', status: 'reserved', date: '2026-10-21', time: '10:00', type_id: 1, type: 'Psicología', attendant_id: 1, attendant: 'Elena Prueba',
  full_name: 'Lucía Quispe Mamani', document_number: '70000001', student_code: 'A211104', contact_email: 'lucia@example.test', contact_phone: null, reason: 'Orientación',
  note: null, is_urgent: false, attendance_confirmed: false, cancel_reason: null,
  actions: { attended: true, no_show: true, cancel: true, confirm: false, reject: false, reassign: true, reopen: false }, ...overrides,
});

const result = (items: DbuQueueItem[]): DbuQueueResult => ({
  date: '2026-10-21', scope: 'all', items,
  summary: { total: items.length, reserved: items.length, pending: 0, attended: 0, no_show: 0, cancelled: 0, urgent: 0 },
  types: [{ id: 1, name: 'Psicología' }], attendants: [{ id: 1, name: 'Elena Prueba' }, { id: 2, name: 'Raúl Prueba' }],
});

const wrap = <T>(data: T) => of({ status: 'success', payload: { data } } as never);

describe('DbuQueueComponent', () => {
  const service = { list: jasmine.createSpy('list'), show: jasmine.createSpy('show'), act: jasmine.createSpy('act') };

  beforeEach(async () => {
    Object.values(service).forEach(spy => spy.calls.reset());
    service.list.and.returnValue(wrap(result([item(), item({ id: 2, time: '11:00', full_name: 'Diego Huamán', status: 'attended', actions: { attended: false, no_show: false, cancel: false, confirm: false, reject: false, reassign: false, reopen: true } })])));
    service.show.and.callFake((id: number) => wrap(item({ id })));
    service.act.and.returnValue(wrap(item({ status: 'attended' })));

    await TestBed.configureTestingModule({
      imports: [DbuQueueComponent],
      providers: [provideNoopAnimations(), { provide: DbuQueueService, useValue: service }, { provide: NotificationService, useValue: { notifyApiData: () => undefined } }],
    }).compileComponents();
  });

  it('renders the day and settles instead of re-rendering forever', async () => {
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.autoDetectChanges(true);

    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cola de citas');
    expect(text).toContain('Lucía Quispe Mamani');
    expect(text).toContain('Reservada');
    expect(text).toContain('Atendida');
  });

  it('shows the empty state when the day has no appointments', () => {
    service.list.and.returnValue(wrap(result([])));
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="queue-empty"]')).not.toBeNull();
  });

  it('shows an error with a retry when the queue cannot be loaded', () => {
    service.list.and.returnValue(throwError(() => ({ status: 500 })));
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudo cargar la cola');
  });

  it('loads the appointment and marks it as attended with the note', () => {
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.open(item());
    expect(service.show).toHaveBeenCalledWith(1);
    component.note = 'Primera sesión';
    component.run('attended');

    expect(service.act).toHaveBeenCalledWith(1, 'attended', { note: 'Primera sesión' });
    expect(component.selected()?.status).toBe('attended');
  });

  it('asks for a reason before cancelling and sends it', () => {
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.open(item());

    component.askCancel('cancel');
    expect(component.cancelDialog).toBeTrue();
    expect(service.act).not.toHaveBeenCalled();

    component.cancelReason = 'La encargada no estará';
    component.confirmCancel();

    expect(service.act).toHaveBeenCalledWith(1, 'cancel', { note: null, reason: 'La encargada no estará' });
  });

  it('shows the server message when an action is refused', () => {
    service.act.and.returnValue(throwError(() => ({ error: { payload: { message: 'La cita no está en un estado que permita esa acción.' } } })));
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.open(item());

    component.run('no-show');

    expect(component.detailError()).toContain('no está en un estado');
    expect(component.busy()).toBeFalse();
  });

  it('only offers to reassign to another attendant', () => {
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.selected.set(item());

    expect(component.reassignOptions().map(option => option.value)).toEqual([2]);
    component.newAttendantId = 2;
    component.reassign();
    expect(service.act).toHaveBeenCalledWith(1, 'reassign', { note: null, attendant_id: 2 });
  });

  it('moves one day at a time', () => {
    const fixture = TestBed.createComponent(DbuQueueComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const before = component.date.getDate();

    component.moveDay(1);

    expect(component.date.getDate()).not.toBe(before);
    expect(service.list).toHaveBeenCalledTimes(2);
  });

  it('formats the day and the error message', () => {
    expect(dbuDayLabel('2026-10-21')).toContain('21 de octubre');
    expect(dbuQueueErrorMessage({})).toContain('No se pudo');
    expect(dbuQueueErrorMessage({ error: { payload: { message: 'Mensaje' } } })).toBe('Mensaje');
  });
});
