import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
  /** El seguimiento vive en un cajón de PrimeNG que se pega al `body`: se busca en la pantalla y, si no está, en la página. */
  const find = (testId: string) => html().querySelector(`[data-testid="${testId}"]`) ?? document.body.querySelector(`[data-testid="${testId}"]`);
  const findAll = (testId: string) => [...html().querySelectorAll(`[data-testid="${testId}"]`), ...document.body.querySelectorAll(`[data-testid="${testId}"]`)].filter((element, index, all) => all.indexOf(element) === index);
  const text = (testId: string) => find(testId)?.textContent?.trim() ?? '';

  /** Un PDF de verdad con las páginas que se indiquen: el contador del navegador lo lee con la misma librería. */
  const realPdf = async (name: string, pages: number) => {
    const { PDFDocument } = await import('pdf-lib');
    const document = await PDFDocument.create();
    for (let index = 0; index < pages; index++) document.addPage();

    return new File([(await document.save()) as BlobPart], name, { type: 'application/pdf' });
  };
  const until = async (condition: () => boolean) => {
    for (let attempt = 0; attempt < 150 && !condition(); attempt++) await new Promise(resolve => setTimeout(resolve, 20));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  async function create() {
    await TestBed.configureTestingModule({
      imports: [DirectiveDetailComponent],
      providers: [
        provideRouter([]), provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        { provide: DirectivesService, useValue: service },
        { provide: NotificationService, useValue: notifications },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(DirectiveDetailComponent);
    fixture.autoDetectChanges();
    // Las pruebas abren el cajón del seguimiento para leer sus movimientos, como hace la persona con el botón.
    fixture.componentInstance.trackingOpen.set(true);
    fixture.componentInstance.routeOpen.set(true);
    await fixture.whenStable();
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['detail', 'route', 'file', 'remove', 'send', 'cancel', 'update']);
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
    expect(findAll('route-step').length).toBe(4);
    expect(findAll('route-step').map(step => step.textContent).join(' ')).not.toContain('Calidad');
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
      { type: 'created', version: 1, at: '2026-11-03T10:00:00Z', by: { id: 5, nick: 'ana', name: 'Ana María Quispe Rojas', office: null }, data: {} },
      { type: 'rejected', version: 1, at: '2026-11-04T10:00:00Z', by: null, data: { office: 'Oficina de Asesoría Jurídica', person: 'Carlos Paucar', reason: 'Falta el anexo de costos' } },
    ] }))));
    await create();

    const events = findAll('directive-event');
    expect(events[1].textContent).toContain('Devolvió el documento con observaciones');
    expect(events[1].querySelector('[data-testid="event-detail"]')?.textContent).toBe('Oficina de Asesoría Jurídica · Carlos Paucar · Falta el anexo de costos');
    expect(events[1].textContent).toContain('Firmador');
  });

  it('offers to correct and delete only the draft the person can edit', async () => {
    service.detail.and.returnValue(of(ok(detail({ can_edit: false }))));
    await create();

    expect(fixture.componentInstance.moreItems()).toEqual([]);
    expect(html().querySelector('[data-testid="more-actions"]')).toBeNull();
  });

  it('goes to correct the draft', async () => {
    await create();
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fixture.componentInstance.edit();

    expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/7/editar');
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
    expect(navigate).toHaveBeenCalledWith('documentos-de-gestion');
  });

  it('does not ask Core for the route of a directive that is already in signature', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false }))));
    await create();

    expect(service.route).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('queda registrada al enviarlo a firma');
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

    const steps = Array.from(findAll('progress-step')).map(step => step.textContent ?? '');
    expect(steps.length).toBe(3);
    expect(steps.join(' ')).not.toContain('Calidad');
    expect(steps[0]).toContain('Firmó');
    expect(steps[1]).toContain('Le toca');
    expect(steps[2]).toContain('Espera su turno');
    (html().querySelector('[data-testid="sign-directive"] button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/7/firmar');
  });

  it('offers no signing to someone whose turn it is not', async () => {
    service.detail.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', can_edit: false, can_sign: false }))));
    await create();

    expect(html().querySelector('[data-testid="sign-directive"]')).toBeNull();
  });

  it('says so when the directive is not found or not of the office', async () => {
    service.detail.and.returnValue(throwError(() => ({ status: 404 })));
    await create();

    expect(text('load-error')).toContain('No encontramos ese documento');
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

      expect(text('returned-panel')).toContain('Devuelto por Asesoría Jurídica');
      expect(text('returned-reason')).toContain(REASON);
      expect(text('returned-panel')).toContain('versión 2');
      expect(html().querySelector('[data-testid="resubmit-directive"]')).not.toBeNull();

      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      (html().querySelector('[data-testid="resubmit-directive"] button') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith('documentos-de-gestion/7/corregir');
    });

    it('marks what was signed as the previous version and who has no turn', async () => {
      service.detail.and.returnValue(of(ok(returned({ can_resubmit: true }))));
      await create();

      const steps = Array.from(findAll('progress-step')).map(step => step.textContent);
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
      expect(fixture.componentInstance.moreItems().map(item => item.label)).not.toContain('Anular documento');
      expect(html().querySelector('[data-testid="more-actions"]')).toBeNull();

      service.detail.and.returnValue(of(ok(inSignature())));
      fixture.componentInstance.load();
      fixture.detectChanges();
      expect(fixture.componentInstance.moreItems().map(item => item.label)).toContain('Anular documento');
      expect(html().querySelector('[data-testid="more-actions"]')).not.toBeNull();
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
      expect(text('cancelled-panel')).toContain('Anulado por Oficina de Administración');
      expect(text('cancelled-reason')).toContain(REASON);
      expect(fixture.componentInstance.moreItems().map(item => item.label)).not.toContain('Anular documento');
      expect(Array.from(findAll('progress-step'))[1].textContent).toContain('No llegó a firmar');
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

      expect(text('cancelled-panel')).toContain('Anulado por Oficina de Administración');
      expect(text('cancelled-no-reason')).toContain('El motivo lo ve la oficina de origen');
      expect(html().querySelector('[data-testid="cancelled-reason"]')).toBeNull();
    });

    it('shows the cancel notice in the timeline', async () => {
      service.detail.and.returnValue(of(ok(detail({
        status: 'cancelled', status_label: 'Anulada', can_edit: false,
        events: [{ type: 'notice_sent', version: 1, at: '2026-11-14T10:20:00Z', by: null, data: { notice: 'cancelled', office: 'Asesoría Jurídica', person: 'Carlos Paucar V.' } }],
      }))));
      await create();

      expect(text('directive-event')).toContain('Aviso enviado: el documento fue anulado');
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

      expect(text('signed-panel')).toContain('por 4 oficinas');
      expect(text('signed-panel')).toContain('Versión 2');
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

      const events = findAll('directive-event').map(row => row.textContent);
      expect(events[0]).toContain('No se pudo traer el documento firmado: la huella no coincide con la que declara el firmador');
      expect(events[0]).toContain('Academical');
      expect(events[0]).toContain('se vuelve a intentar al pulsar «Descargar firmada»');
      expect(events[0]).not.toContain('hash_mismatch');
      expect(events[1]).toContain('Se guardó la copia del documento firmado');
      expect(events[1]).toContain('4 firmas');
    });
  });

  describe('route and tracking buttons', () => {
    it('puts the route and the tracking behind two small buttons of the header, with no cards of their own', async () => {
      await create();

      expect(html().querySelector('[data-testid="route-button"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="tracking-button"]')).not.toBeNull();
      expect(html().querySelector('p-panel:not([data-testid="tech-panel"])')).toBeNull();
      expect(text('route-panel')).toContain('Ruta de firmas');
    });

    it('shows the number of steps and of movements, and opens each drawer from its button', async () => {
      await create();
      const component = fixture.componentInstance;
      component.routeOpen.set(false);
      component.trackingOpen.set(false);
      fixture.detectChanges();

      expect(text('route-count')).toBe(String(component.routeCount()));
      expect(text('tracking-count')).toBe(String(component.directive()!.events.length));
      html().querySelector<HTMLElement>('[data-testid="route-button"]')!.click();
      html().querySelector<HTMLElement>('[data-testid="tracking-button"]')!.click();
      fixture.detectChanges();
      expect(component.routeOpen()).toBeTrue();
      expect(component.trackingOpen()).toBeTrue();
    });
  });

  it('offers to replace each PDF only while the draft can be edited', async () => {
    await create();

    expect(html().querySelector('[data-testid="replace-directive"]')).not.toBeNull();
    expect(html().querySelector('[data-testid="replace-resolution"]')).not.toBeNull();
    expect(text('replace-hint')).toContain('Mientras sea borrador');
    fixture.destroy();
    TestBed.resetTestingModule();

    service.detail.and.returnValue(of(ok(detail({ can_edit: false }))));
    await create();
    expect(html().querySelector('[data-testid="replace-directive"]')).toBeNull();
    expect(html().querySelector('[data-testid="replace-hint"]')).toBeNull();
  });

  it('stages the chosen PDF with its page count and uploads nothing until it is saved', async () => {
    await create();
    const clear = jasmine.createSpy('clear');

    fixture.componentInstance.pickReplacement('directive', { currentFiles: [await realPdf('nueva-directiva.pdf', 2)] } as never, { clear } as never);
    await until(() => fixture.componentInstance.staged().directive?.pages === 2);

    expect(clear).toHaveBeenCalled();
    expect(text('staged-directive')).toContain('Sin guardar');
    expect(text('staged-directive')).toContain('nueva-directiva.pdf');
    expect(text('staged-directive-pages')).toBe('2 páginas');
    expect(text('files-panel')).toContain('directiva.pdf');
    expect(text('staged-warning')).toContain('antes de enviar a firma');
    expect(service.update).not.toHaveBeenCalled();
  });

  it('saves only the chosen file and shows the new file, its pages and the new fingerprint', async () => {
    await create();
    const file = await realPdf('nueva-directiva.pdf', 2);
    fixture.componentInstance.pickReplacement('directive', { currentFiles: [file] } as never, { clear: () => undefined } as never);
    await until(() => fixture.componentInstance.staged().directive?.pages === 2);
    service.update.and.returnValue(of(ok(detail({ files: { directive: { name: 'nueva-directiva.pdf', size: 1700, pages: 2 }, resolution: { name: 'resolucion.pdf', size: 600000, pages: 3 } } }))));

    (html().querySelector('[data-testid="save-replace-directive"] button') as HTMLButtonElement).click();
    await until(() => fixture.componentInstance.staged().directive === null);

    const body = service.update.calls.mostRecent().args[1] as FormData;
    expect(service.update.calls.mostRecent().args[0]).toBe(7);
    expect(body.get('directive')).toBe(file);
    expect(body.has('title')).toBeFalse();
    expect(body.has('resolution')).toBeFalse();
    expect(text('files-panel')).toContain('nueva-directiva.pdf');
    expect(text('files-panel')).toContain('2 páginas');
    expect(notifications.notifyApiData).toHaveBeenCalled();
    expect(html().querySelector('[data-testid="staged-directive"]')).toBeNull();
  });

  it('drops the chosen PDF when it is discarded', async () => {
    await create();
    fixture.componentInstance.pickReplacement('resolution', { currentFiles: [await realPdf('otra.pdf', 1)] } as never, { clear: () => undefined } as never);
    await until(() => fixture.componentInstance.staged().resolution?.pages === 1);

    (html().querySelector('[data-testid="discard-replace-resolution"] button') as HTMLButtonElement).click();
    await until(() => fixture.componentInstance.staged().resolution === null);

    expect(html().querySelector('[data-testid="staged-resolution"]')).toBeNull();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('refuses a file that is not a PDF or is too big, and keeps what was there', async () => {
    await create();
    const clear = () => undefined;

    fixture.componentInstance.pickReplacement('directive', { currentFiles: [new File(['x'], 'directiva.docx', { type: 'application/msword' })] } as never, { clear } as never);
    fixture.detectChanges();
    expect(text('replace-error')).toContain('debe ser un PDF');

    fixture.componentInstance.pickReplacement('resolution', { currentFiles: [new File([new Uint8Array(1)], 'grande.pdf', { type: 'application/pdf' })] } as never, { clear } as never);
    expect(fixture.componentInstance.staged().resolution).not.toBeNull();

    const big = new File([new Uint8Array(10)], 'enorme.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 });
    fixture.componentInstance.pickReplacement('directive', { currentFiles: [big] } as never, { clear } as never);
    fixture.detectChanges();
    expect(text('replace-error')).toContain('el máximo es');
    expect(fixture.componentInstance.staged().directive).toBeNull();
  });

  it('shows what the server says when the replacement fails and keeps the chosen file', async () => {
    await create();
    fixture.componentInstance.pickReplacement('directive', { currentFiles: [await realPdf('nueva.pdf', 1)] } as never, { clear: () => undefined } as never);
    await until(() => fixture.componentInstance.staged().directive?.pages === 1);
    service.update.and.returnValue(throwError(() => ({ error: { payload: { message: 'No es un PDF válido.' } } })));

    (html().querySelector('[data-testid="save-replace-directive"] button') as HTMLButtonElement).click();
    await until(() => fixture.componentInstance.replacing() === null);

    expect(text('replace-error')).toBe('No es un PDF válido.');
    expect(fixture.componentInstance.staged().directive).not.toBeNull();
  });

  it('warns in the confirmation to send that a chosen PDF is not saved and will not be sent', async () => {
    service.route.and.returnValue(of(ok(route({ can_send: true, issues: [] }))));
    await create();
    const confirm = spyOn(fixture.debugElement.injector.get(ConfirmationService), 'confirm');
    fixture.componentInstance.pickReplacement('directive', { currentFiles: [await realPdf('nueva.pdf', 1)] } as never, { clear: () => undefined } as never);
    await until(() => fixture.componentInstance.staged().directive?.pages === 1);

    fixture.componentInstance.askSend();

    expect(confirm.calls.mostRecent().args[0].message).toContain('NO se enviará');
  });

  it('says in the timeline which file replaced which', async () => {
    service.detail.and.returnValue(of(ok(detail({ events: [
      { type: 'edited', version: 1, at: '2026-11-10T18:52:00Z', by: { id: 5, nick: 'ana', name: 'Ana María Quispe Rojas', office: null }, data: { directive_replaced: true, resolution_replaced: false, directive_before: 'vieja.pdf', directive_after: 'nueva.pdf' } },
      { type: 'created', version: 1, at: '2026-11-10T18:37:00Z', by: { id: 5, nick: 'ana', name: 'Ana María Quispe Rojas', office: null }, data: {} },
    ] }))));
    await create();

    const first = find('directive-event')!.textContent!;
    expect(first).toContain('Reemplazó el documento');
    expect(first).toContain('vieja.pdf');
    expect(first).toContain('nueva.pdf');
  });
  it('says what changed in a correction, with before and after, and who did it by name and office', async () => {
    service.detail.and.returnValue(of(ok(detail({ events: [
      {
        type: 'edited', version: 1, at: '2026-11-10T18:40:00Z', by: { id: 5, nick: 'ana', name: 'Yamil Alberto Peña Loayza', office: 'Oficina de Tecnologías de la Información' },
        data: { fields: ['title', 'is_quality'], changes: { title: { before: 'Prueba', after: 'PRUEBA 001' }, is_quality: { before: false, after: true }, document_subtype: { before: 'POI', after: null } } },
      },
    ] }))));
    await create();

    const event = find('directive-event')!;
    expect(event.textContent).toContain('Corrigió los datos');
    const changes = Array.from(event.querySelectorAll('[data-testid="event-change"]')).map(row => Array.from(row.children).map(part => part.textContent!.trim()));
    expect(changes).toEqual([['Título', 'Prueba', 'PRUEBA 001'], ['Proceso de calidad', 'No', 'Sí'], ['Subtipo', 'POI', '—']]);
    expect(event.textContent).toContain('Yamil Alberto Peña Loayza · Oficina de Tecnologías de la Información');
    expect(event.textContent).not.toContain('ana');
  });

  it('labels a correction that also replaced a PDF as correcting the draft', async () => {
    service.detail.and.returnValue(of(ok(detail({ events: [
      { type: 'edited', version: 1, at: '2026-11-10T18:40:00Z', by: { id: 5, nick: 'ana', name: 'Ana María Quispe Rojas', office: null }, data: { changes: { title: { before: 'A', after: 'B' } }, resolution_replaced: true, resolution_before: 'a.pdf', resolution_after: 'b.pdf' } },
    ] }))));
    await create();

    const event = find('directive-event')!;
    expect(event.textContent).toContain('Corrigió el borrador');
    expect(event.querySelectorAll('[data-testid="event-change"]').length).toBe(2);
  });

  it('shows the type and subtype of the document under its title', async () => {
    service.detail.and.returnValue(of(ok(detail({ document_type: { code: 'gestion_institucional', label: 'Documentos de gestión institucional' }, document_subtype: { code: 'pei', label: 'PEI' } }))));
    await create();

    expect(text('directive-type')).toContain('Documentos de gestión institucional · PEI');
    expect(text('directive-type')).toContain('Oficina de Administración');
  });

  describe('redesigned header and banners', () => {
    const steps = [
      { key: 'origin', label: 'Oficina de Administración', person: 'Ana Torres', title: 'Jefa', state: 'signed' as const },
      { key: 'legal', label: 'Asesoría Jurídica', person: 'Carlos Paucar', title: 'Jefe', state: 'active' as const },
      { key: 'president', label: 'Presidencia', person: 'Rosa Quispe', title: 'Presidenta', state: 'waiting' as const },
    ];
    const inSignature = (overrides = {}) => detail({ status: 'in_signature', status_label: 'En firma', can_edit: false, can_cancel: true, progress: steps, active_office: 'Asesoría Jurídica', ...overrides });

    it('has breadcrumbs back to the list instead of a Volver button', async () => {
      await create();

      expect(text('breadcrumb')).toContain('Documentos de gestión');
      expect(text('breadcrumb')).toContain(fixture.componentInstance.directive()!.title);
      expect(html().textContent).not.toContain('Volver');
    });

    it('keeps one main action per state and the rest in the actions menu', async () => {
      await create();
      let labels = fixture.componentInstance.moreItems().map(item => item.label);
      expect(labels).toEqual(['Corregir datos y archivos', 'Eliminar borrador']);
      expect(html().querySelector('[data-testid="send-directive"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="sign-directive"]')).toBeNull();
      fixture.destroy();
      TestBed.resetTestingModule();

      service.detail.and.returnValue(of(ok(inSignature({ can_sign: true }))));
      await create();
      labels = fixture.componentInstance.moreItems().map(item => item.label);
      expect(labels).toEqual(['Anular documento']);
      expect(html().querySelector('[data-testid="sign-directive"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="send-directive"]')).toBeNull();
    });

    it('says in a banner that it is a draft, whose turn it is, or that it is the persons turn', async () => {
      await create();
      expect(text('draft-banner')).toContain('Es un borrador');
      fixture.destroy();
      TestBed.resetTestingModule();

      service.detail.and.returnValue(of(ok(inSignature())));
      await create();
      expect(text('turn-banner')).toContain('Le toca firmar a Carlos Paucar');
      expect(text('turn-banner')).toContain('Asesoría Jurídica');
      expect(html().querySelector('[data-testid="draft-banner"]')).toBeNull();
      fixture.destroy();
      TestBed.resetTestingModule();

      service.detail.and.returnValue(of(ok(inSignature({ can_sign: true, viewer: 'pending' }))));
      await create();
      expect(text('turn-banner')).toContain('Te toca firmar');
      expect(html().querySelector('[data-testid="viewer-note"]')).toBeNull();
    });

    it('shows the progress of the signatures with the count of the offices that signed', async () => {
      service.detail.and.returnValue(of(ok(inSignature())));
      await create();

      expect(text('progress-count')).toBe('1 de 3 firmas');
      expect(findAll('progress-chip').length).toBe(3);
      expect(text('progress-card')).toContain('Ana Torres');
    });

    it('has no progress card in a draft, and a summary card with the facts of the document', async () => {
      await create();

      expect(html().querySelector('[data-testid="progress-card"]')).toBeNull();
      expect(text('summary-card')).toContain('Oficina de origen');
      expect(text('summary-card')).toContain('Versión');
    });

    it('keeps the fingerprints inside a collapsed technical details panel', async () => {
      await create();

      expect(find('tech-panel')).not.toBeNull();
      expect(text('directive-hash')).toContain('a'.repeat(64));
      expect(text('resolution-hash')).toContain('b'.repeat(64));
    });

    it('downloads the signed copy from the main action of a signed document', async () => {
      service.detail.and.returnValue(of(ok(detail({ status: 'signed', status_label: 'Firmada', can_edit: false, signed: { version: 1, code: 'K7F9M-2QXP4', signatures: 4, verify_url: null, can_download: true, available: true, name: 'f.pdf', size: 1000, sha256: 'f'.repeat(64) } }))));
      await create();

      expect(html().querySelector('[data-testid="download-signed"] button')).not.toBeNull();
      expect(html().querySelector('[data-testid="sign-directive"]')).toBeNull();
    });
  });
});
