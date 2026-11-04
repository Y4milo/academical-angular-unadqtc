import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CoreSsoFailure, CoreSsoService } from './core-sso.service';
import { CoreResultComponent } from './core-result.component';

describe('CoreResultComponent', () => {
  let fixture: ComponentFixture<CoreResultComponent>;
  let service: jasmine.SpyObj<CoreSsoService>;

  const failure = (overrides: Partial<CoreSsoFailure> = {}): CoreSsoFailure => ({
    reason: 'not_linked',
    reference: 'SSO-NV-7F3A2C',
    account: { name: 'Ana Torres Quispe', email: 'ana.torres@unadqtc.edu.pe' },
    ...overrides,
  });
  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const button = (testId: string) => html().querySelector(`[data-testid="${testId}"] button`) as HTMLButtonElement | null;

  function create(reason: string, options: { required?: boolean; portal?: string | null; failure?: CoreSsoFailure | null } = {}) {
    service.failure.and.returnValue(of({ failure: options.failure === undefined ? failure({ reason }) : options.failure }));
    fixture = TestBed.createComponent(CoreResultComponent);
    fixture.componentRef.setInput('reason', reason);
    fixture.componentRef.setInput('required', options.required ?? false);
    fixture.componentRef.setInput('portalUrl', options.portal === undefined ? 'https://core.test/mis-sistemas' : options.portal);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<CoreSsoService>('CoreSsoService', ['failure', 'goTo', 'redirectUrl']);
    service.redirectUrl.and.returnValue('/api/auth/core/redirect');
    await TestBed.configureTestingModule({
      imports: [CoreResultComponent],
      providers: [provideNoopAnimations(), { provide: CoreSsoService, useValue: service }],
    }).compileComponents();
  });

  it('tells a person whose Core account is not linked who came in, what to do and the code to give to OTI', () => {
    create('not_linked', { required: true });

    expect(text('result-title')).toBe('Tu cuenta de Core aún no está vinculada');
    expect(text('result-account')).toContain('Ana Torres Quispe');
    expect(text('result-account')).toContain('ana.torres@unadqtc.edu.pe');
    expect(text('result-todo')).toContain('Oficina de Tecnologías de la Información');
    expect(text('result-reference')).toContain('SSO-NV-7F3A2C');
    expect(button('retry')).toBeNull();
  });

  it('says the user is inactive in plain words', () => {
    create('inactive');

    expect(text('result-title')).toBe('Tu usuario de Academical está inactivo');
    expect(text('result-body')).toContain('desactivado');
  });

  it('offers to try again when Core did not answer, and it is not the person’s fault', () => {
    create('core_unreachable', { failure: failure({ reason: 'core_unreachable', reference: 'SSO-CU-19B04E', account: null }) });

    expect(text('result-title')).toBe('No pudimos conectar con Core');
    expect(html().querySelector('[data-testid="result-account"]')).toBeNull();
    button('retry')!.click();

    expect(service.goTo).toHaveBeenCalledWith('/api/auth/core/redirect');
  });

  it('uses a generic message for a reason it does not know and still shows the reference', () => {
    create('something_new', { failure: failure({ reason: 'something_new', reference: 'SSO-XX-000001', account: null }) });

    expect(text('result-title')).toBe('No pudimos completar el ingreso');
    expect(text('result-reference')).toContain('SSO-XX-000001');
  });

  it('sends the person back to Core', () => {
    create('access_denied');

    button('back-to-core')!.click();

    expect(service.goTo).toHaveBeenCalledWith('https://core.test/mis-sistemas');
  });

  it('does not offer the login of Academical when Core is required, and does when it is optional', () => {
    create('not_linked', { required: true });
    expect(button('use-local-login')).toBeNull();

    fixture.destroy();
    create('not_linked', { required: false });
    expect(button('use-local-login')).not.toBeNull();
  });

  it('still explains what happened when the details of the attempt cannot be read', () => {
    service.failure.and.returnValue(throwError(() => ({ status: 500 })));
    fixture = TestBed.createComponent(CoreResultComponent);
    fixture.componentRef.setInput('reason', 'not_linked');
    fixture.detectChanges();

    expect(text('result-title')).toBe('Tu cuenta de Core aún no está vinculada');
    expect(html().querySelector('[data-testid="result-reference"]')).toBeNull();
  });

  it('copies the code and says so', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    create('not_linked');

    button('copy-reference')!.click();
    // No se espera a `whenStable`: el aviso «Copiado» se apaga solo con un temporizador y whenStable lo esperaría.
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as unknown as Record<string, unknown>)['clipboard'];

    expect(writeText).toHaveBeenCalledWith('SSO-NV-7F3A2C');
    expect(fixture.componentInstance.copied()).toBeTrue();
    expect(text('copy-reference')).toContain('Copiado');
  });
});
