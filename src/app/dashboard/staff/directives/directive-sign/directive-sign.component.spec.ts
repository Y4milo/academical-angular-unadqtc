import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DirectivesService, SigningSession } from '../../../../services/directives.service';
import { FirmaPeruSignerService, SignerHandlers } from '../../../../services/firma-peru-signer.service';
import { detail, ok } from '../testing/directive-fixtures';
import { DirectiveSignComponent } from './directive-sign.component';

describe('DirectiveSignComponent', () => {
  let fixture: ComponentFixture<DirectiveSignComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let signer: jasmine.SpyObj<FirmaPeruSignerService>;
  let router: Router;
  let handlers: SignerHandlers;

  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const turn = () =>
    detail({
      status: 'in_signature', status_label: 'En firma', can_edit: false, can_sign: true, active_office: 'Asesoría Jurídica',
      progress: [
        { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' },
        { key: 'quality', label: 'Gestión de la Calidad', person: null, title: null, state: 'skipped' },
        { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe', state: 'active' },
        { key: 'presidency', label: 'Presidencia', person: 'Rosa Quispe', title: 'Presidenta', state: 'waiting' },
      ],
    });
  const session: SigningSession = {
    session_id: 'ses_1', expires_at: new Date(Date.now() + 600_000).toISOString(), stamp_reason: 'Visto bueno · Asesoría Jurídica', office: 'Asesoría Jurídica', document: 'directiva.pdf',
    firmaperu: { script_url: 'https://firmador.test/script.js', port: 48596, param: 'cGFyYW0=' },
  };

  async function create() {
    fixture = TestBed.createComponent(DirectiveSignComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  async function sign() {
    (html().querySelector('[data-testid="sign-button"] button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['detail', 'file', 'openSigningSession', 'reportSigningEvent', 'reject']);
    signer = jasmine.createSpyObj<FirmaPeruSignerService>('FirmaPeruSignerService', ['environment', 'load', 'start']);
    service.detail.and.returnValue(of(ok(turn())));
    service.file.and.returnValue(of(new Blob(['%PDF'])));
    service.openSigningSession.and.returnValue(of(ok(session)));
    service.reportSigningEvent.and.returnValue(of(ok({})));
    signer.environment.and.returnValue({ browser: 'Microsoft Edge', recommended: true, windows: true });
    signer.load.and.resolveTo();
    signer.start.and.callFake((_port, _param, given) => {
      handlers = given;
    });
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
    await TestBed.configureTestingModule({
      imports: [DirectiveSignComponent],
      providers: [
        provideRouter([]), provideNoopAnimations(),
        { provide: DirectivesService, useValue: service },
        { provide: FirmaPeruSignerService, useValue: signer },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('shows the shape of the screen while it loads', async () => {
    service.detail.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[data-testid="sign-skeleton"]')).not.toBeNull();
  });

  it('says whose turn it is, shows the directive and who signed before', async () => {
    await create();

    expect(text('turn')).toContain('paso 2 de 3');
    expect(text('turn')).toContain('Asesoría Jurídica');
    expect(service.file).toHaveBeenCalledWith(7, 'directive');
    expect(html().querySelector('[data-testid="preview"]')).not.toBeNull();
    expect(text('before-step')).toContain('Ana Torres');
  });

  describe('rejecting', () => {
    const REASON = 'El artículo 5 contradice la Directiva 003-2025.';
    const rejectable = () => detail({ ...turn(), can_reject: true });

    it('offers to reject only to who has the turn and can reject', async () => {
      await create();
      expect(html().querySelector('[data-testid="reject-button"]')).toBeNull();

      service.detail.and.returnValue(of(ok(rejectable())));
      fixture.componentInstance.load();
      fixture.detectChanges();
      expect(html().querySelector('[data-testid="reject-button"]')).not.toBeNull();
    });

    it('needs a reason of at least 10 characters and the acknowledgment before it can be confirmed', async () => {
      service.detail.and.returnValue(of(ok(rejectable())));
      await create();
      const component = fixture.componentInstance;
      component.openReject();
      fixture.detectChanges();

      expect(component.canReject()).toBeFalse();
      component.rejectReason.set('corto');
      component.rejectAck.set(true);
      expect(component.reasonTooShort()).toBeTrue();
      expect(component.canReject()).toBeFalse();
      component.rejectReason.set(REASON);
      expect(component.reasonTooShort()).toBeFalse();
      expect(component.canReject()).toBeTrue();
      component.rejectAck.set(false);
      expect(component.canReject()).toBeFalse();
    });

    it('sends the reason, closes the dialog and says the directive went back', async () => {
      service.detail.and.returnValue(of(ok(rejectable())));
      service.reject.and.returnValue(of(ok(detail({ status: 'returned', status_label: 'Devuelta' }))));
      await create();
      const component = fixture.componentInstance;
      component.openReject();
      component.rejectReason.set(`  ${REASON}  `);
      component.rejectAck.set(true);

      component.reject();
      fixture.detectChanges();

      expect(service.reject).toHaveBeenCalledOnceWith(7, REASON);
      expect(component.rejectOpen()).toBeFalse();
      expect(text('rejected-done')).toContain('Volvió a la oficina de origen');
      expect(html().querySelector('[data-testid="sign-button"]')).toBeNull();
    });

    it('keeps the dialog and shows what the server said when it cannot reject', async () => {
      service.detail.and.returnValue(of(ok(rejectable())));
      service.reject.and.returnValue(throwError(() => ({ status: 409, error: { payload: { message: 'En el firmador esta directiva ya no está esperando tu firma.' } } })));
      await create();
      const component = fixture.componentInstance;
      component.openReject();
      component.rejectReason.set(REASON);
      component.rejectAck.set(true);

      component.reject();

      expect(component.rejectOpen()).toBeTrue();
      expect(component.rejectError()).toContain('ya no está esperando tu firma');
      expect(component.rejectSending()).toBeFalse();
      expect(component.rejectedDone()).toBeFalse();
    });

    it('does not open the dialog while a signature is in progress', async () => {
      service.detail.and.returnValue(of(ok(rejectable())));
      await create();
      fixture.componentInstance.phase.set('waiting');

      fixture.componentInstance.openReject();

      expect(fixture.componentInstance.rejectOpen()).toBeFalse();
    });
  });

  it('shows the other document when asked', async () => {
    await create();
    fixture.componentInstance.preview('resolution');

    expect(service.file).toHaveBeenCalledWith(7, 'resolution');
  });

  it('does not offer to sign when it is not the turn of the person', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', can_sign: false, active_office: 'Presidencia' }))));
    await create();

    expect(text('not-your-turn')).toContain('ahora le toca a Presidencia');
    expect(html().querySelector('[data-testid="sign-button"]')).toBeNull();
  });

  it('warns when the browser is not the recommended one', async () => {
    signer.environment.and.returnValue({ browser: 'Firefox', recommended: false, windows: true });
    fixture = TestBed.createComponent(DirectiveSignComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();

    expect(text('environment-warning')).toContain('Firefox');
  });

  it('opens the session, starts the local signer with what the server gave and shows the reason of the signature', async () => {
    await create();
    await sign();

    expect(service.openSigningSession).toHaveBeenCalledWith(7);
    expect(signer.load).toHaveBeenCalledWith('https://firmador.test/script.js');
    expect(signer.start).toHaveBeenCalledWith(48596, 'cGFyYW0=', jasmine.any(Object));
    expect(text('stamp-reason')).toContain('Visto bueno · Asesoría Jurídica');
    expect(text('status-waiting')).toContain('Elige tu certificado');

    handlers.init?.();
    expect(service.reportSigningEvent).toHaveBeenCalledWith(7, 'ses_1', 1, 'started', undefined);
  });

  it('reports a cancellation to the signer and lets the person try again', async () => {
    await create();
    await sign();

    handlers.cancel();
    fixture.detectChanges();

    expect(service.reportSigningEvent).toHaveBeenCalledWith(7, 'ses_1', 1, 'cancelled', 'La persona cerró la firma');
    expect(text('sign-notice')).toContain('Cerraste la firma sin terminar');
    expect(html().querySelector('[data-testid="sign-button"]')).not.toBeNull();
  });

  it('explains when the session cannot be opened and does not start the local signer', async () => {
    service.openSigningSession.and.returnValue(throwError(() => ({ error: { payload: { message: 'Ya tienes una sesión de firma abierta.' } } })));
    await create();
    await sign();

    expect(text('sign-error')).toContain('Ya tienes una sesión de firma abierta.');
    expect(signer.start).not.toHaveBeenCalled();
  });

  it('reports an error when the local signer cannot be loaded', async () => {
    signer.load.and.rejectWith(new Error('sin red'));
    await create();
    await sign();

    expect(service.reportSigningEvent).toHaveBeenCalledWith(7, 'ses_1', 1, 'error', 'No se pudo iniciar el firmador local');
    expect(text('sign-error')).toContain('No se pudo iniciar el firmador de Firma Perú');
  });

  it('reports the timeout to the signer when the session runs out before the person finishes', async () => {
    jasmine.clock().install();
    service.openSigningSession.and.returnValue(of(ok({ ...session, expires_at: new Date(Date.now() + 1000).toISOString() })));
    await create();
    await sign();

    jasmine.clock().tick(1500);
    fixture.detectChanges();

    expect(service.reportSigningEvent).toHaveBeenCalledWith(7, 'ses_1', 1, 'timeout', undefined);
    expect(text('sign-error')).toContain('Se acabó el tiempo');
  });

  it('after the signature it waits for the signer to confirm and then says it was registered', async () => {
    await create();
    await sign();
    jasmine.clock().install();
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', can_sign: false, active_office: 'Presidencia' }))));

    handlers.ok();
    fixture.detectChanges();
    expect(service.reportSigningEvent).toHaveBeenCalledWith(7, 'ses_1', 1, 'ok_reported', undefined);
    expect(text('status-confirming')).toContain('Confirmando');

    jasmine.clock().tick(3000);
    fixture.detectChanges();

    expect(text('signed-ok')).toContain('Tu firma quedó registrada');
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    (html().querySelector('[data-testid="go-detail"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('directivas/7');
  });

  it('says the confirmation may take a while when the signer has not answered after several tries', async () => {
    await create();
    await sign();
    jasmine.clock().install();

    handlers.ok();
    for (let i = 0; i < 10; i++) {
      jasmine.clock().tick(3000);
    }
    fixture.detectChanges();

    expect(text('signed-pending')).toContain('puede tardar unos segundos');
  });

  it('says so when the directive is not found or not of the person', async () => {
    service.detail.and.returnValue(throwError(() => ({ status: 404 })));
    await create();

    expect(text('load-error')).toContain('No encontramos esa directiva');
  });
  it('has the tracking button in its header, like the other screens of the module', async () => {
    await create();

    expect(html().querySelector('[data-testid="tracking-button"]')).not.toBeNull();
  });
});
