import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { NotificationService } from '../../../../services/notification.service';
import { Semester, SemestersService } from '../../../../services/semesters.service';
import { CardModulePayload, CardPaymentsPage, CardSettings, StudentCardModuleService } from '../../../../services/student-card-module.service';
import { StudentCardSettingsComponent } from './student-card-settings.component';
import { dateToDateTime, dateTimeToDate } from '../../../../core/utils/date-input.util';

const settings: CardSettings = {
  enabled: true, upload_start: '2026-11-02 00:00', upload_end: '2026-11-13 23:59', max_attempts: 3, dni_required: true, photo_required: true,
  require_payment: true, photo_min_kb: 4, photo_max_kb: 50, photo_width: 240, photo_height: 288,
};

const semester = (overrides: Partial<Semester>): Semester => ({ id: 1, name: '2026-II', label: null, start_date: '2026-08-16', end_date: '2026-12-18', state: 'enabled', card_start_date: null, card_end_date: null, ...overrides });

const module = (overrides: Partial<CardModulePayload> = {}): CardModulePayload => ({ semester: { id: 1, name: '2026-II', state: 'available' }, settings, configured: true, locked: false, editable: true, ...overrides });

const payments: CardPaymentsPage = {
  payments: [{ payment_id: 1, number: '70000001', code: '2026001', payment_status: 'used-pay', payment_label: 'Pago utilizado', student: 'Ana Quispe', card_status: 'validated', card_label: 'Validado' }],
  total: 1, page: 1, per_page: 25, options: { payment: [{ value: 'only-paid', label: 'Pagado' }], card: [{ value: 'validated', label: 'Validado' }] },
};

const ok = <T>(data: T): never => of({ status: 'success', payload: { title: 'Listo', message: 'Hecho', data } }) as never;

describe('StudentCardSettingsComponent', () => {
  let service: jasmine.SpyObj<StudentCardModuleService>;

  const create = (mod: CardModulePayload = module()) => {
    service = jasmine.createSpyObj<StudentCardModuleService>('StudentCardModuleService', ['show', 'save', 'copyFromPrevious', 'payments', 'exportPayments']);
    service.show.and.returnValue(ok(mod));
    service.payments.and.returnValue(ok(payments));
    const semesters = jasmine.createSpyObj<SemestersService>('SemestersService', ['list']);
    semesters.list.and.returnValue(ok({ semesters: [semester({}), semester({ id: 2, name: '2027-I', state: 'draft' })] }));

    TestBed.configureTestingModule({
      imports: [StudentCardSettingsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: StudentCardModuleService, useValue: service },
        { provide: SemestersService, useValue: semesters },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['success', 'error']) },
      ],
    });
    const fixture = TestBed.createComponent(StudentCardSettingsComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('converts dates between the API and the date picker', () => {
    expect(dateToDateTime(dateTimeToDate('2026-11-02 08:30'))).toBe('2026-11-02 08:30');
    expect(dateTimeToDate(null)).toBeNull();
    expect(dateToDateTime(null)).toBeNull();
  });

  it('only offers semesters that are not drafts and loads the settings and payments of the first one', () => {
    const fixture = create();
    const component = fixture.componentInstance;

    expect(component.selectable().map(item => item.name)).toEqual(['2026-II']);
    expect(service.show).toHaveBeenCalledWith(1);
    expect(service.payments).toHaveBeenCalled();
    expect(dateToDateTime(component.startAt)).toBe('2026-11-02 00:00');
    expect(fixture.nativeElement.textContent).toContain('Ana Quispe');
  });

  it('validates the dates and the photo size before saving', () => {
    const component = create().componentInstance;

    component.endAt = new Date(2026, 9, 1);
    component.save();
    expect(component.formError).toContain('posterior');

    component.endAt = new Date(2026, 10, 13, 23, 59);
    component.form!.photo_max_kb = 2;
    component.save();
    expect(component.formError).toContain('mínimo');
    expect(service.save).not.toHaveBeenCalled();
  });

  it('asks for a note when the window has closed', () => {
    const component = create(module({ locked: true })).componentInstance;

    component.save();
    expect(component.formError).toContain('motivo');
    expect(service.save).not.toHaveBeenCalled();
  });

  it('saves the settings with the dates in the API format', () => {
    const component = create().componentInstance;
    service.save.and.returnValue(ok(module()));

    component.save();

    expect(service.save).toHaveBeenCalledWith(1, jasmine.objectContaining({ upload_start: '2026-11-02 00:00', upload_end: '2026-11-13 23:59', max_attempts: 3 }), null);
  });
});
