import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { detail, ok, route } from '../testing/directive-fixtures';
import { DirectiveDetailComponent } from './directive-detail.component';

describe('DirectiveDetailComponent', () => {
  let fixture: ComponentFixture<DirectiveDetailComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let router: Router;

  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';

  async function create() {
    await TestBed.configureTestingModule({
      imports: [DirectiveDetailComponent],
      providers: [
        provideRouter([]), provideNoopAnimations(),
        { provide: DirectivesService, useValue: service },
        { provide: NotificationService, useValue: notifications },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(DirectiveDetailComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['detail', 'route', 'file', 'remove', 'send', 'cancel']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['notifyApiData', 'error']);
    service.detail.and.returnValue(of(ok(detail())));
    service.route.and.returnValue(of(ok(route())));
  });

  it('shows the shape of the screen while it loads', async () => {
    service.detail.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[data-testid="detail-skeleton"]')).not.toBeNull();
  });

  it('shows the draft with its state, both files, the route and the timeline', async () => {
    await create();

    expect(text('directive-title')).toBe('Directiva para el control de bienes patrimoniales');
    expect(text('directive-status')).toBe('Borrador');
    expect(text('files-panel')).toContain('directiva.pdf');
    expect(text('files-panel')).toContain('14 páginas');
    expect(text('files-panel')).toContain('resolucion.pdf');
    expect(text('directive-hash')).toContain('a'.repeat(64));
    expect(html().querySelectorAll('[data-testid="route-step"]').length).toBe(5);
    expect(text('directive-event')).toContain('Creó el borrador');
    expect(service.route).toHaveBeenCalledWith('adm', false);
  });

  it('keeps sending disabled while Core has nobody in an office, and says why', async () => {
    await create();
    const button = html().querySelector('[data-testid="send-directive"] button') as HTMLButtonElement;

    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.canSend()).toBeFalse();
    expect(fixture.componentInstance.sendBlockedReason()).toContain('Core no tiene a alguien designado');
  });

  it('enables sending when every office has its person, and asks before sending', async () => {
    service.route.and.returnValue(of(ok(route({ can_send: true, issues: [] }))));
    service.send.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false }))));
    await create();
    const button = html().querySelector('[data-testid="send-directive"] button') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();

    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    const confirm = spyOn(confirmation, 'confirm').and.callFake(options => { options.accept?.(); return confirmation; });
    fixture.componentInstance.askSend();
    fixture.detectChanges();

    expect(confirm.calls.mostRecent().args[0].message).toContain('4 oficinas');
    expect(service.send).toHaveBeenCalledWith(7);
    expect(text('directive-status')).toBe('En firma');
    expect(html().querySelector('[data-testid="send-directive"]')).toBeNull();
    expect(notifications.notifyApiData).toHaveBeenCalled();
  });

  it('shows what the server answers when it cannot send, and keeps the draft', async () => {
    service.route.and.returnValue(of(ok(route({ can_send: true, issues: [] }))));
    service.send.and.returnValue(throwError(() => ({ status: 503, error: { payload: { message: 'El firmador todavía no está conectado.' } } })));
    await create();
    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    spyOn(confirmation, 'confirm').and.callFake(options => { options.accept?.(); return confirmation; });

    fixture.componentInstance.askSend();
    fixture.detectChanges();

    expect(text('send-error')).toContain('El firmador todavía no está conectado');
    expect(text('directive-status')).toBe('Borrador');
    expect(fixture.componentInstance.sending()).toBeFalse();
  });

  it('tells what each notice of the signer means: office, person and reason', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'returned', status_label: 'Devuelta', can_edit: false, events: [
      { type: 'created', version: 1, at: '2026-11-03T10:00:00Z', by: { id: 5, nick: 'ana' }, data: {} },
      { type: 'rejected', version: 1, at: '2026-11-04T10:00:00Z', by: null, data: { office: 'Oficina de Asesoría Jurídica', person: 'Carlos Paucar', reason: 'Falta el anexo de costos' } },
    ] }))));
    await create();

    const events = Array.from(html().querySelectorAll('[data-testid="directive-event"]'));
    expect(events[1].textContent).toContain('Devolvió la directiva con observaciones');
    expect(events[1].querySelector('[data-testid="event-detail"]')?.textContent).toBe('Oficina de Asesoría Jurídica · Carlos Paucar · Falta el anexo de costos');
    expect(events[1].textContent).toContain('Firmador');
  });

  it('offers to correct and delete only the draft the person can edit', async () => {
    service.detail.and.returnValue(of(ok(detail({ can_edit: false }))));
    await create();

    expect(html().querySelector('[data-testid="edit-directive"]')).toBeNull();
    expect(html().querySelector('[data-testid="delete-directive"]')).toBeNull();
  });

  it('goes to correct the draft', async () => {
    await create();
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.componentInstance.edit();

    expect(navigate).toHaveBeenCalledWith('directivas/7/editar');
  });

  it('asks before deleting the draft and goes back to the list after', async () => {
    service.remove.and.returnValue(of(ok({})));
    await create();
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    const confirm = spyOn(confirmation, 'confirm').and.callFake(options => { options.accept?.(); return confirmation; });

    fixture.componentInstance.askDelete();

    expect(confirm).toHaveBeenCalled();
    expect(service.remove).toHaveBeenCalledWith(7);
    expect(navigate).toHaveBeenCalledWith('directivas');
  });

  it('does not ask Core for the route of a directive that is already in signature', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false }))));
    await create();

    expect(service.route).not.toHaveBeenCalled();
    expect(text('route-panel')).toContain('queda registrada al enviarla a firma');
    expect(html().querySelector('[data-testid="send-directive"]')).toBeNull();
  });

  it('opens a PDF in a new tab through the session and tells when it cannot', async () => {
    const tab = { location: { href: '' }, close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue(tab as unknown as Window);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
    service.file.and.returnValue(of(new Blob(['%PDF'])));
    await create();

    fixture.componentInstance.openFile('resolution');
    expect(service.file).toHaveBeenCalledWith(7, 'resolution', undefined);
    expect(tab.location.href).toBe('blob:pdf');

    service.file.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.componentInstance.openFile('directive');
    expect(tab.close).toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalled();
  });

  it('shows who signed, whose turn it is and who waits, and lets the person whose turn it is go and sign', async () => {
    service.detail.and.returnValue(of(ok(detail({
      status: 'in_signature', status_label: 'En firma', can_edit: false, can_sign: true, active_office: 'Asesoría Jurídica',
      progress: [
        { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' },
        { key: 'quality', label: 'Gestión de la Calidad', person: null, title: null, state: 'skipped' },
        { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe encargado', state: 'active' },
        { key: 'presidency', label: 'Presidencia', person: 'Rosa Quispe', title: 'Presidenta', state: 'waiting' },
      ],
    }))));
    await create();
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const steps = Array.from(html().querySelectorAll('[data-testid="progress-step"]')).map(step => step.textContent ?? '');
    expect(steps.length).toBe(4);
    expect(steps[0]).toContain('Firmó');
    expect(steps[2]).toContain('Le toca');
    expect(steps[3]).toContain('Espera su turno');
    (html().querySelector('[data-testid="sign-directive"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('directivas/7/firmar');
  });

  it('offers no signing to someone whose turn it is not', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false, can_sign: false }))));
    await create();

    expect(html().querySelector('[data-testid="sign-directive"]')).toBeNull();
  });

  it('says so when the directive is not found or not of the office', async () => {
    service.detail.and.returnValue(throwError(() => ({ status: 404 })));
    await create();

    expect(text('load-error')).toContain('No encontramos esa directiva');
  });

  describe('a returned directive', () => {
    const REASON = 'El artículo 5 contradice la Directiva 003-2025.';
    const progress = [
      { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' as const },
      { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe', state: 'rejected' as const },
      { key: 'presidency', label: 'Presidencia', person: 'Rosa Quispe', title: 'Presidenta', state: 'waiting' as const },
    ];
    const returned = (overrides = {}) =>
      detail({
        status: 'returned', status_label: 'Devuelta', can_edit: false, progress, returned: { version: 1, office: 'Asesoría Jurídica', at: '2026-11-13T08:40:00Z', person: 'Carlos Paucar', reason: REASON },
        events: [{ type: 'rejected', version: 1, at: '2026-11-13T08:40:00Z', by: null, data: { office: 'Asesoría Jurídica', reason: REASON } }], ...overrides,
      });

    it('shows the reason to the origin and offers to correct and resend', async () => {
      service.detail.and.returnValue(of(ok(returned({ can_resubmit: true }))));
      await create();

      expect(text('returned-panel')).toContain('Devuelta por Asesoría Jurídica');
      expect(text('returned-reason')).toContain(REASON);
      expect(text('returned-panel')).toContain('versión 2');
      expect(html().querySelector('[data-testid="resubmit-directive"]')).not.toBeNull();

      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      (html().querySelector('[data-testid="resubmit-directive"] button') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith('directivas/7/corregir');
    });

    it('marks what was signed as the previous version and who has no turn', async () => {
      service.detail.and.returnValue(of(ok(returned({ can_resubmit: true }))));
      await create();

      const steps = Array.from(html().querySelectorAll('[data-testid="progress-step"]')).map(step => step.textContent);
      expect(steps[0]).toContain('Firmó la versión 1');
      expect(steps[1]).toContain('Devolvió');
      expect(steps[2]).toContain('Sin turno');
    });

    it('tells an office that already signed who returned it, without the reason, and that it will sign again', async () => {
      service.detail.and.returnValue(of(ok(returned({ viewer: 'signed', returned: { version: 1, office: 'Asesoría Jurídica', at: '2026-11-13T08:40:00Z', person: null, reason: null } }))));
      await create();

      expect(text('viewer-note')).toContain('modo consulta');
      expect(text('returned-no-reason')).toContain('El motivo lo ven la oficina de origen');
      expect(html().querySelector('[data-testid="returned-reason"]')).toBeNull();
      expect(text('returned-panel')).toContain('volverás a firmar');
      expect(html().querySelector('[data-testid="resubmit-directive"]')).toBeNull();
    });

    it('says the documents are enabled on the turn when the viewer may not read them', async () => {
      service.detail.and.returnValue(of(ok(returned({ viewer: 'pending', files: null, sha256: null, files_visible: false }))));
      await create();

      expect(text('files-hidden')).toContain('cuando te toque firmar');
      expect(html().querySelector('[data-testid="open-directive"]')).toBeNull();
    });

    it('lists the versions and opens the PDF of a chosen one', async () => {
      const versions = [
        { version: 2, current: true, signed: false, created_at: '2026-11-16T10:00:00Z', directive: { name: 'directiva-v2.pdf', size: 1, pages: 14 }, resolution: { name: 'resolucion.pdf', size: 1, pages: 3 } },
        { version: 1, current: false, signed: false, created_at: '2026-11-12T08:50:00Z', directive: { name: 'directiva.pdf', size: 1, pages: 14 }, resolution: { name: 'resolucion.pdf', size: 1, pages: 3 } },
      ];
      service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false, versions, version: 2 }))));
      service.file.and.returnValue(of(new Blob(['%PDF'])));
      spyOn(window, 'open').and.returnValue({ location: { href: '' }, close: () => undefined } as unknown as Window);
      spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
      await create();

      const rows = html().querySelectorAll('[data-testid="version-row"]');
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('Versión 2 · vigente');
      (rows[1].querySelector('button') as HTMLButtonElement).click();

      expect(service.file).toHaveBeenCalledWith(7, 'directive', 1);
    });

    it('shows no versions panel while there is only one', async () => {
      service.detail.and.returnValue(of(ok(detail())));
      await create();

      expect(html().querySelector('[data-testid="versions-panel"]')).toBeNull();
    });
  });

  describe('the notices in the timeline', () => {
    const notice = (type: string, data: Record<string, unknown>) => ({ type, version: 1, at: '2026-11-13T08:41:00Z', by: null, data });

    it('shows each notice sent with who it went to and that Academical sent it', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'in_signature', status_label: 'En firma', can_edit: false,
        events: [notice('notice_sent', { notice: 'void', office: 'Gestión de la Calidad', person: 'Laura Mendoza R.' })],
      }))));
      await create();

      expect(text('directive-event')).toContain('Aviso enviado: tu firma quedó sin efecto');
      expect(text('event-detail')).toBe('Para Laura Mendoza R. · Gestión de la Calidad');
      expect(text('directive-event')).toContain('Academical');
      expect(text('directive-event')).not.toContain('Firmador');
    });

    it('says why a notice did not go out, without the address, and that the pending signature still shows', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'in_signature', status_label: 'En firma', can_edit: false,
        events: [notice('notice_failed', { notice: 'turn', office: 'Asesoría Jurídica', person: 'Carlos Paucar V.', reason: 'no_email' })],
      }))));
      await create();

      expect(text('directive-event')).toContain('No se pudo avisar: la persona no tiene correo institucional en Core');
      expect(text('event-detail')).toContain('Para Carlos Paucar V. · Asesoría Jurídica');
      expect(text('event-detail')).toContain('«Por firmar»');
    });

    it('names a mail server failure as such', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'in_signature', status_label: 'En firma', can_edit: false,
        events: [notice('notice_failed', { notice: 'returned', office: 'Oficina de Administración', person: 'Ana Torres V.', reason: 'mail_error' })],
      }))));
      await create();

      expect(text('directive-event')).toContain('el servidor de correo no respondió');
      expect(text('event-detail')).not.toContain('Por firmar');
    });
  });

  describe('cancelling', () => {
    const REASON = 'La directiva se reemplaza por la Directiva 012-2026; esta ya no debe circular.';
    const inSignature = (overrides = {}) =>
      detail({
        status: 'in_signature', status_label: 'En firma', can_edit: false, can_cancel: true,
        progress: [
          { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' as const },
          { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe', state: 'active' as const },
          { key: 'president', label: 'Presidencia', person: 'Rosa Quispe', title: 'Presidenta', state: 'waiting' as const },
        ], ...overrides,
      });

    it('offers to cancel only when the server allows it', async () => {
      service.detail.and.returnValue(of(ok(inSignature({ can_cancel: false }))));
      await create();
      expect(html().querySelector('[data-testid="cancel-directive"]')).toBeNull();

      service.detail.and.returnValue(of(ok(inSignature())));
      fixture.componentInstance.load();
      fixture.detectChanges();
      expect(html().querySelector('[data-testid="cancel-directive"]')).not.toBeNull();
    });

    it('needs a reason of at least 10 characters and the acknowledgment', async () => {
      service.detail.and.returnValue(of(ok(inSignature())));
      await create();
      const component = fixture.componentInstance;
      component.openCancel();

      expect(component.canConfirmCancel()).toBeFalse();
      component.cancelReason.set('corto');
      component.cancelAck.set(true);
      expect(component.reasonTooShort()).toBeTrue();
      expect(component.canConfirmCancel()).toBeFalse();
      component.cancelReason.set(REASON);
      expect(component.canConfirmCancel()).toBeTrue();
      component.cancelAck.set(false);
      expect(component.canConfirmCancel()).toBeFalse();
    });

    it('sends the reason, closes the dialog and shows the directive as cancelled with the reason', async () => {
      service.detail.and.returnValue(of(ok(inSignature())));
      service.cancel.and.returnValue(of(ok(detail({
        status: 'cancelled', status_label: 'Anulada', can_edit: false, can_cancel: false,
        cancelled: { version: 1, office: 'Oficina de Administración', at: '2026-11-14T10:20:00Z', person: 'ana', reason: REASON },
        progress: [
          { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' as const },
          { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe', state: 'waiting' as const },
        ],
      }))));
      await create();
      const component = fixture.componentInstance;
      component.openCancel();
      component.cancelReason.set(`  ${REASON}  `);
      component.cancelAck.set(true);

      component.cancel();
      fixture.detectChanges();

      expect(service.cancel).toHaveBeenCalledOnceWith(7, REASON);
      expect(component.cancelOpen()).toBeFalse();
      expect(notifications.notifyApiData).toHaveBeenCalled();
      expect(text('cancelled-panel')).toContain('Anulada por Oficina de Administración');
      expect(text('cancelled-reason')).toContain(REASON);
      expect(html().querySelector('[data-testid="cancel-directive"]')).toBeNull();
      expect(Array.from(html().querySelectorAll('[data-testid="progress-step"]'))[1].textContent).toContain('No llegó a firmar');
    });

    it('keeps the dialog and shows what the server said when the signer does not let it', async () => {
      service.detail.and.returnValue(of(ok(inSignature())));
      service.cancel.and.returnValue(throwError(() => ({ status: 409, error: { payload: { message: 'En el firmador esta directiva ya no se puede cancelar.' } } })));
      await create();
      const component = fixture.componentInstance;
      component.openCancel();
      component.cancelReason.set(REASON);
      component.cancelAck.set(true);

      component.cancel();

      expect(component.cancelOpen()).toBeTrue();
      expect(component.cancelError()).toContain('ya no se puede cancelar');
      expect(component.cancelSending()).toBeFalse();
      expect(component.directive()?.status).toBe('in_signature');
    });

    it('tells a route office who cancelled without the reason', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'cancelled', status_label: 'Anulada', can_edit: false, viewer: 'signed',
        cancelled: { version: 1, office: 'Oficina de Administración', at: '2026-11-14T10:20:00Z', person: null, reason: null },
      }))));
      await create();

      expect(text('cancelled-panel')).toContain('Anulada por Oficina de Administración');
      expect(text('cancelled-no-reason')).toContain('El motivo lo ve la oficina de origen');
      expect(html().querySelector('[data-testid="cancelled-reason"]')).toBeNull();
    });

    it('shows the cancel notice in the timeline', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'cancelled', status_label: 'Anulada', can_edit: false,
        events: [{ type: 'notice_sent', version: 1, at: '2026-11-14T10:20:00Z', by: null, data: { notice: 'cancelled', office: 'Asesoría Jurídica', person: 'Carlos Paucar V.' } }],
      }))));
      await create();

      expect(text('directive-event')).toContain('Aviso enviado: la directiva fue anulada');
      expect(text('event-detail')).toBe('Para Carlos Paucar V. · Asesoría Jurídica');
    });
  });

  describe('the signed document', () => {
    const signed = (overrides = {}) => ({
      version: 2, code: 'K7F9M-2QXP4', signatures: 4, verify_url: 'https://firmas.unadqtc.test/verifica/K7F9M-2QXP4', can_download: true, available: true,
      name: 'Directiva_bienes_2026_v2_firmada.pdf', size: 2_100_000, sha256: 'f'.repeat(64), ...overrides,
    });
    const completed = (overrides = {}) => detail({ status: 'signed', status_label: 'Firmada', can_edit: false, version: 2, signed: signed(), ...overrides });

    it('shows the key, the number of signatures, the file and the public verification link', async () => {
      service.detail.and.returnValue(of(ok(completed())));
      await create();

      expect(text('signed-panel')).toContain('Versión 2 · 4 firmas');
      expect(text('signed-code')).toBe('K7F9M-2QXP4');
      expect(text('signed-name')).toContain('Directiva_bienes_2026_v2_firmada.pdf');
      expect(text('signed-hash')).toContain('f'.repeat(64));
      const link = html().querySelector('[data-testid="verify-link"]') as HTMLAnchorElement;
      expect(link.href).toBe('https://firmas.unadqtc.test/verifica/K7F9M-2QXP4');
      expect(link.rel).toContain('noopener');
    });

    it('shows no signed panel while the directive has not been signed by everybody', async () => {
      service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false }))));
      await create();

      expect(html().querySelector('[data-testid="signed-panel"]')).toBeNull();
    });

    it('downloads the signed file with its name', async () => {
      service.detail.and.returnValue(of(ok(completed())));
      service.file.and.returnValue(of(new Blob(['%PDF'])));
      spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
      const click = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();
      await create();

      (html().querySelector('[data-testid="download-signed"] button') as HTMLButtonElement).click();

      expect(service.file).toHaveBeenCalledWith(7, 'signed', 2);
      expect(click).toHaveBeenCalled();
      expect(fixture.componentInstance.signedLoading()).toBeFalse();
    });

    it('says the copy is not stored yet, and after a failure shows what the server said and offers to try again', async () => {
      service.detail.and.returnValue(of(ok(completed({ signed: signed({ available: false, name: null, size: null, sha256: null }) }))));
      const body = new Blob([JSON.stringify({ payload: { message: 'No se pudo traer el documento firmado: el firmador no respondió. Tus firmas están a salvo allá.' } })]);
      service.file.and.returnValue(throwError(() => ({ status: 503, error: body })));
      await create();
      expect(text('signed-panel')).toContain('todavía no se guardó la copia en Academical');

      fixture.componentInstance.downloadSigned();
      await new Promise(resolve => setTimeout(resolve, 30));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(text('signed-error')).toContain('el firmador no respondió');
      expect(text('download-signed')).toContain('Reintentar descarga');
      expect(fixture.componentInstance.signedLoading()).toBeFalse();
    });

    it('keeps the key visible but offers no download to an office that may not read the PDF', async () => {
      service.detail.and.returnValue(of(ok(completed({ viewer: 'pending', signed: signed({ can_download: false, available: false, name: null, size: null, sha256: null }) }))));
      await create();

      expect(text('signed-no-access')).toContain('el administrador lo tiene configurado así');
      expect(text('signed-code')).toBe('K7F9M-2QXP4');
      expect(html().querySelector('[data-testid="download-signed"]')).toBeNull();
      expect(html().querySelector('[data-testid="signed-hash"]')).toBeNull();
    });

    it('shows only the key when there is no public verification address configured', async () => {
      service.detail.and.returnValue(of(ok(completed({ signed: signed({ verify_url: null }) }))));
      await create();

      expect(html().querySelector('[data-testid="verify-link"]')).toBeNull();
      expect(text('signed-code')).toBe('K7F9M-2QXP4');
    });

    it('copies the key', async () => {
      service.detail.and.returnValue(of(ok(completed())));
      const write = jasmine.createSpy('writeText').and.resolveTo();
      spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: write } as unknown as Clipboard);
      await create();

      fixture.componentInstance.copyCode();
      await fixture.whenStable();

      expect(write).toHaveBeenCalledWith('K7F9M-2QXP4');
      expect(fixture.componentInstance.codeCopied()).toBeTrue();
    });

    it('marks which version has the signed document in the list of versions', async () => {
      const versions = [
        { version: 2, current: true, signed: true, created_at: '2026-11-16T10:00:00Z', directive: { name: 'd2.pdf', size: 1, pages: 14 }, resolution: { name: 'r.pdf', size: 1, pages: 3 } },
        { version: 1, current: false, signed: false, created_at: '2026-11-12T08:50:00Z', directive: { name: 'd1.pdf', size: 1, pages: 14 }, resolution: { name: 'r.pdf', size: 1, pages: 3 } },
      ];
      service.detail.and.returnValue(of(ok(completed({ versions }))));
      await create();

      const rows = html().querySelectorAll('[data-testid="version-row"]');
      expect(rows[0].textContent).toContain('Firmada');
      expect(rows[1].textContent).toContain('Sin documento firmado');
    });

    it('records in the timeline when the signed copy was saved and why it could not be fetched', async () => {
      const event = (type: string, data: Record<string, unknown>) => ({ type, version: 2, at: '2026-11-18T10:25:00Z', by: null, data });
      service.detail.and.returnValue(of(ok(completed({ events: [event('signed_copy_failed', { reason: 'hash_mismatch' }), event('signed_copy_saved', { signatures: 4 })] }))));
      await create();

      const events = Array.from(html().querySelectorAll('[data-testid="directive-event"]')).map(row => row.textContent);
      expect(events[0]).toContain('No se pudo traer el documento firmado: la huella no coincide con la que declara el firmador');
      expect(events[0]).toContain('Academical');
      expect(events[0]).toContain('se vuelve a intentar al pulsar «Descargar firmada»');
      expect(events[0]).not.toContain('hash_mismatch');
      expect(events[1]).toContain('Se guardó la copia del documento firmado');
      expect(events[1]).toContain('4 firmas');
    });
  });

  describe('collapsible cards', () => {
    const toggle = (testId: string) => html().querySelector<HTMLElement>(`[data-testid="${testId}"] .p-panel-toggler, [data-testid="${testId}"] .p-panel-header-icon`);

    it('draws the route and the follow-up as collapsible panels that start open', async () => {
      await create();
      const component = fixture.componentInstance;

      expect(html().querySelector('p-panel[data-testid="route-panel"]')).not.toBeNull();
      expect(html().querySelector('p-panel[data-testid="timeline-panel"]')).not.toBeNull();
      expect(toggle('route-panel')).not.toBeNull();
      expect(toggle('timeline-panel')).not.toBeNull();
      expect(component.routeCollapsed()).toBeFalse();
      expect(component.timelineCollapsed()).toBeFalse();
      expect(text('route-panel')).toContain('Ruta de firmas');
      expect(text('timeline-panel')).toContain('Seguimiento');
    });

    it('collapses each card on its own', async () => {
      await create();
      const component = fixture.componentInstance;

      toggle('timeline-panel')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.timelineCollapsed()).toBeTrue();
      expect(component.routeCollapsed()).toBeFalse();

      toggle('route-panel')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.routeCollapsed()).toBeTrue();

      toggle('timeline-panel')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.timelineCollapsed()).toBeFalse();
    });

    it('keeps both cards open on a phone width', async () => {
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(375);
      await create();

      expect(fixture.componentInstance.routeCollapsed()).toBeFalse();
      expect(fixture.componentInstance.timelineCollapsed()).toBeFalse();
    });
  });

  describe('hint of the collapsible cards', () => {
    const header = (testId: string) => html().querySelector<HTMLElement>(`[data-testid="${testId}"] .p-panel-header`);

    it('tells to click to see the detail while a card is collapsed and to click to hide it while open', async () => {
      await create();
      const component = fixture.componentInstance;

      expect(text('timeline-hint')).toBe('Haz clic para ocultar');
      expect(text('route-hint')).toBe('Haz clic para ocultar');

      component.timelineCollapsed.set(true);
      component.routeCollapsed.set(true);
      fixture.detectChanges();

      expect(text('timeline-hint')).toBe('Haz clic para ver el detalle');
      expect(text('route-hint')).toBe('Haz clic para ver el detalle');
    });

    it('toggles the card when the person clicks anywhere on its header, as the hint says', async () => {
      await create();
      const component = fixture.componentInstance;

      header('timeline-panel')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.timelineCollapsed()).toBeTrue();
      expect(component.routeCollapsed()).toBeFalse();

      header('timeline-panel')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.timelineCollapsed()).toBeFalse();
    });
  });
});
