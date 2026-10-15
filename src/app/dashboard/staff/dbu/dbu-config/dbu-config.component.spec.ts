import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DbuConfig, DbuConfigService } from '../../../../services/dbu-config.service';
import { NotificationService } from '../../../../services/notification.service';
import { DbuConfigComponent } from './dbu-config.component';

const config: DbuConfig = {
  settings: {
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'], day_start: '08:00', day_end: '15:00', session_minutes: 60, instant_booking: true,
    open_time: '08:00', window_business_days: 5, max_active_per_student: 1, cancel_hours_before: 2, waitlist_enabled: true,
    offer_minutes: 15, urgent_enabled: true, confirm_attendance_enabled: true, reminder_hours_before: 24, release_unconfirmed: false,
    release_hours_before: 2, noshow_threshold: 2, noshow_window_days: 30, noshow_block_days: 7,
  },
  defaults: {} as DbuConfig['defaults'],
  types: [{ id: 1, code: 'psychology', name: 'Psicología', is_active: true }],
  attendants: [{ id: 1, user_id: 4, name: 'Elena Vargas', is_active: true, weekdays: ['mon'], start_time: '08:00', end_time: '15:00', type_ids: [1] }],
  capacity: { '1': { slots: ['08:00', '09:00'], weekdays: ['mon'], matrix: { '08:00': { mon: 1 }, '09:00': { mon: 1 } }, weekly_total: 2 } },
  candidates: [],
};

describe('DbuConfigComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbuConfigComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DbuConfigService, useValue: { config: () => of({ status: 'success', payload: { data: config } }), logs: () => of({ status: 'success', payload: { data: [] } }) } },
        { provide: NotificationService, useValue: { notifyApiData: () => undefined } },
      ],
    }).compileComponents();
  });

  it('draws the loaded configuration without changing a value after it was checked', () => {
    const fixture = TestBed.createComponent(DbuConfigComponent);

    // detectChanges ejecuta también la revisión en modo desarrollo: un valor distinto en cada revisión lanza el error.
    expect(() => fixture.detectChanges()).not.toThrow();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Configuración de citas');
    expect(text).toContain('Horario y días');
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('becomes stable after the first render instead of re-writing the hour pickers forever', async () => {
    const fixture = TestBed.createComponent(DbuConfigComponent);
    fixture.autoDetectChanges(true);

    // Un valor nuevo en cada revisión hace que ngModel vuelva a escribir el selector sin parar y la zona nunca se estabiliza.
    await fixture.whenStable();

    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('shows the capacity matrix and the attendants in their section', () => {
    const fixture = TestBed.createComponent(DbuConfigComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectSection('attendants');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Elena Vargas');
    expect(text).toContain('2 cupos por semana');
  });

  it('keeps the hour pickers on the same Date object between checks', () => {
    const fixture = TestBed.createComponent(DbuConfigComponent);
    fixture.detectChanges();
    const first = fixture.componentInstance.times.day_start;

    fixture.detectChanges();

    expect(fixture.componentInstance.times.day_start).toBe(first);
  });
});
