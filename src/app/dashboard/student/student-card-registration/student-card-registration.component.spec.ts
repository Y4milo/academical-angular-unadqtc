import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DEFAULT_REVIEW_THRESHOLDS } from '../../../core/utils/photo-review.util';
import { NotificationService } from '../../../services/notification.service';
import { CardFlowState, StudentCardFlowService } from '../../../services/student-card-flow.service';
import { StudentCardService } from '../../../services/student-card.service';
import { StudentService } from '../../../services/student.service';
import { StudentCardRegistrationComponent } from './student-card-registration.component';

const baseState: CardFlowState = {
  semester: { id: 1, name: '2026-II' },
  availability: { can_register: true, start_date: '2026-11-02 00:00', end_date: '2026-11-13 23:59', message: 'Abierto', enabled: true },
  rules: { max_attempts: 3, photo_min_kb: 4, photo_max_kb: 50, photo_width: 240, photo_height: 288, photo_review: DEFAULT_REVIEW_THRESHOLDS },
  student: {
    code: '20260341', number: '70000001', check_digit: '3', names: 'Ana', father_last_name: 'Quispe', mother_last_name: 'Ruiz',
    email: 'ana@gmail.com', cellphone: '987654321', address: 'Av. La Cultura 123', birthdate: '2004-03-14', id_type: 'DNI', gender: 'Femenino', campus: 'Cusco',
  },
  photo: { required: true, has_previous: false, previous_semester: null, uploaded_now: false, attempts_left: 3 },
  dni: { required: true, has_previous: false, uploaded_now: false, attempts_left: 3 },
  card: { status: null, submitted: false },
  payment_required: true,
};

const ok = <T>(data: T): never => of({ status: 'success', payload: { title: 'Listo', message: 'Hecho', data } }) as never;

describe('StudentCardRegistrationComponent', () => {
  let flow: jasmine.SpyObj<StudentCardFlowService>;
  let cards: jasmine.SpyObj<StudentCardService>;
  let student: jasmine.SpyObj<StudentService>;

  const create = async (state: CardFlowState) => {
    flow = jasmine.createSpyObj<StudentCardFlowService>('StudentCardFlowService', ['state', 'saveContact', 'submit']);
    flow.state.and.returnValue(ok(state));
    cards = jasmine.createSpyObj<StudentCardService>('StudentCardService', ['downloadFile', 'uploadDniPhoto', 'uploadCardPhoto']);
    cards.downloadFile.and.returnValue(of({ body: null }) as never);
    student = jasmine.createSpyObj<StudentService>('StudentService', ['setPaymentSession']);
    student.setPaymentSession.and.returnValue(ok(null));

    TestBed.configureTestingModule({
      imports: [StudentCardRegistrationComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideRouter([]),
        { provide: StudentCardFlowService, useValue: flow },
        { provide: StudentCardService, useValue: cards },
        { provide: StudentService, useValue: student },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['notifyApiData', 'success', 'error']) },
      ],
    });
    const fixture = TestBed.createComponent(StudentCardRegistrationComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
  };

  it('sets the payment session first and then loads the state', async () => {
    const fixture = await create(baseState);

    expect(student.setPaymentSession).toHaveBeenCalled();
    expect(flow.state).toHaveBeenCalled();
    expect(fixture.componentInstance.state()?.semester.name).toBe('2026-II');
  });

  it('without a previous photo it is a three step flow with the DNI required', async () => {
    const fixture = await create(baseState);
    const component = fixture.componentInstance;

    expect(component.longFlow()).toBeTrue();
    expect(component.steps().map(step => step.label)).toEqual(['Datos', 'DNI', 'Foto']);

    component.next();
    expect(component.step()).toBe(1);

    component.next();
    expect(component.dniError).toContain('DNI');
    expect(component.step()).toBe(1);
  });

  it('with a previous photo it is a single page and no DNI is asked', async () => {
    const fixture = await create({
      ...baseState,
      photo: { required: false, has_previous: true, previous_semester: '2026-I', uploaded_now: false, attempts_left: 3 },
      dni: { required: false, has_previous: true, uploaded_now: false, attempts_left: 3 },
    });
    const text = fixture.nativeElement.textContent as string;

    expect(fixture.componentInstance.longFlow()).toBeFalse();
    expect(text).toContain('Cambiar foto');
    expect(text).toContain('Guardar y enviar');
    expect(text).not.toContain('Foto de tu DNI');
  });

  it('saves the contact data and submits without uploading anything when the previous photo is kept', async () => {
    const fixture = await create({ ...baseState, photo: { ...baseState.photo, has_previous: true, previous_semester: '2026-I' }, dni: { ...baseState.dni, required: false } });
    flow.saveContact.and.returnValue(ok({ id: 1 }));
    flow.submit.and.returnValue(ok({ status: 'validated', auto_validated: true }));

    await fixture.componentInstance.submit();

    expect(flow.saveContact).toHaveBeenCalledWith(jasmine.objectContaining({ email: 'ana@gmail.com', birthdate: '2004-03-14' }));
    expect(cards.uploadCardPhoto).not.toHaveBeenCalled();
    expect(flow.submit).toHaveBeenCalled();
  });

  it('shows the photo and DNI requirements with the SUNEDU link', async () => {
    const fixture = await create(baseState);
    const component = fixture.componentInstance;

    component.step.set(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Requisitos del DNI');

    component.step.set(2);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    const link = fixture.nativeElement.querySelector('a[href="https://siucarne.sunedu.gob.pe/carne/validacion"]');

    expect(text).toContain('Requisitos de la foto');
    expect(text).toContain('obligatorio');
    expect(link).not.toBeNull();
  });

  it('a new photo needs the SUNEDU confirmation and sends it with the review', async () => {
    const fixture = await create(baseState);
    const component = fixture.componentInstance;
    const file = new File([new Uint8Array(10)], 'foto.jpg', { type: 'image/jpeg' });
    (component as unknown as { photoFile: File }).photoFile = file;
    component.review.set({ face: true, checks: [{ key: 'size', group: 'file', label: 'Tamaño', value: '28 KB', ok: true }] });

    expect(component.canSubmit).toBeFalse();
    component.suneduConfirmed.set(true);
    expect(component.canSubmit).toBeTrue();

    cards.uploadCardPhoto.and.returnValue(ok(null));
    await (component as unknown as { upload(type: 'photo', file: File): Promise<boolean> }).upload('photo', file);
    const sent = cards.uploadCardPhoto.calls.mostRecent().args[0] as FormData;

    expect(sent.get('sunedu_confirmed')).toBe('1');
    expect(JSON.parse(sent.get('client_review') as string).checks[0].key).toBe('size');
  });

  it('keeping the previous photo needs no confirmation', async () => {
    const fixture = await create({ ...baseState, photo: { ...baseState.photo, has_previous: true, previous_semester: '2026-I' }, dni: { ...baseState.dni, required: false } });

    expect(fixture.componentInstance.canSubmit).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('Requisitos de la foto');
  });

  it('shows the read-only status when the registration is closed', async () => {
    const fixture = await create({ ...baseState, availability: { ...baseState.availability, can_register: false, message: 'Cerró' }, card: { status: 'validated', submitted: true } });
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Validado');
    expect(text).toContain('Cerró');
    expect(text).not.toContain('Guardar y enviar');
  });
});
