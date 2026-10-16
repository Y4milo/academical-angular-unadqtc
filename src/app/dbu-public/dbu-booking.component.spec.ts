import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DbuBookingComponent } from './dbu-booking.component';
import { DbuPublicAvailability, DbuPublicConfig, DbuPublicService } from './dbu-public.service';

const config: DbuPublicConfig = {
  types: [{ id: 1, code: 'psychology', name: 'Psicología' }, { id: 2, code: 'health', name: 'Salud' }],
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'], day_start: '08:00', day_end: '15:00', session_minutes: 60, window_business_days: 5,
  open_time: '08:00', max_active_per_student: 1, cancel_hours_before: 2, instant_booking: true, test_mode: false,
  turnstile: { enabled: false, site_key: null },
};

const availability: DbuPublicAvailability = {
  type: config.types[0],
  days: [
    { date: '2026-10-22', weekday: 'thu', free_total: 2, slots: [{ time: '10:00', capacity: 1, booked: 0, free: 1, available: true }, { time: '11:00', capacity: 1, booked: 1, free: 0, available: false }] },
    { date: '2026-10-23', weekday: 'fri', free_total: 0, slots: [{ time: '10:00', capacity: 0, booked: 0, free: 0, available: false }] },
  ],
};

const wrap = <T>(data: T) => of({ status: 'success', payload: { data } } as never);

describe('DbuBookingComponent', () => {
  const service = {
    configuration: jasmine.createSpy('configuration'), identity: jasmine.createSpy('identity'), sendCode: jasmine.createSpy('sendCode'),
    verifyCode: jasmine.createSpy('verifyCode'), availability: jasmine.createSpy('availability'), reserve: jasmine.createSpy('reserve'),
  };

  beforeEach(async () => {
    Object.values(service).forEach(spy => spy.calls.reset());
    service.configuration.and.returnValue(wrap(config));
    service.identity.and.returnValue(wrap({ session: 's'.repeat(40), name: 'VICTORIA B.', expires_in: 1800 }));
    service.sendCode.and.returnValue(wrap({ sent_to: 'a***@example.test' }));
    service.verifyCode.and.returnValue(wrap({ verified: true }));
    service.availability.and.returnValue(wrap(availability));
    service.reserve.and.returnValue(wrap({ code: 'CT-4F7K2P', status: 'reserved', type: 'Psicología', date: '2026-10-22', time: '10:00', can_cancel: true }));

    await TestBed.configureTestingModule({
      imports: [DbuBookingComponent],
      providers: [provideNoopAnimations(), provideRouter([]), { provide: DbuPublicService, useValue: service }],
    }).compileComponents();
  });

  it('renders the first step and settles instead of re-rendering forever', async () => {
    const fixture = TestBed.createComponent(DbuBookingComponent);
    fixture.autoDetectChanges(true);

    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('¿Quién eres?');
  });

  it('walks the whole flow and shows the appointment code', async () => {
    const fixture = TestBed.createComponent(DbuBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.documentNumber = '71424933';
    component.submitIdentity();
    expect(component.step()).toBe('email');

    component.email = 'ana@example.test';
    component.sendCode();
    expect(component.step()).toBe('code');
    expect(component.sentTo()).toBe('a***@example.test');

    component.code = '123456';
    component.verifyCode();
    expect(component.step()).toBe('choose');

    component.typeId = 1;
    component.loadAvailability();
    expect(component.dayOptions().length).toBe(1);
    component.chooseDate('2026-10-22');
    expect(component.timeOptions().map(option => option.disabled)).toEqual([false, true]);

    component.selectedTime = '10:00';
    component.reserve();
    fixture.detectChanges();

    expect(component.step()).toBe('done');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="dbu-code"]')?.textContent).toContain('CT-4F7K2P');
    component.ngOnDestroy();
  });

  it('keeps the same option arrays between checks', () => {
    const fixture = TestBed.createComponent(DbuBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.typeId = 1;
    component.loadAvailability();
    fixture.detectChanges();

    expect(component.dayOptions()).toBe(component.dayOptions());
  });

  it('shows the reason when the booking is refused and reloads what is free', () => {
    const fixture = TestBed.createComponent(DbuBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    service.reserve.and.returnValue(throwError(() => ({ error: { payload: { message: 'Ese horario ya no está disponible. Elige otro.' } } })));

    component.typeId = 1;
    component.chooseDate('2026-10-22');
    component.selectedTime = '10:00';
    component.reserve();

    expect(component.error()).toContain('ya no está disponible');
    expect(service.availability).toHaveBeenCalled();
    expect(component.step()).toBe('identity');
  });

  it('asks for the security challenge only when it is enabled', () => {
    service.configuration.and.returnValue(wrap({ ...config, turnstile: { enabled: true, site_key: 'site' } }));
    const fixture = TestBed.createComponent(DbuBookingComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.documentNumber = '71424933';

    expect(component.canSubmitIdentity()).toBeFalse();
    component.turnstileToken.set('token');
    expect(component.canSubmitIdentity()).toBeTrue();
  });
});
