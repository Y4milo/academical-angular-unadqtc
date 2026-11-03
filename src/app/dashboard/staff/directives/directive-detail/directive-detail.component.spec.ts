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
        { version: 2, current: true, created_at: '2026-11-16T10:00:00Z', directive: { name: 'directiva-v2.pdf', size: 1, pages: 14 }, resolution: { name: 'resolucion.pdf', size: 1, pages: 3 } },
        { version: 1, current: false, created_at: '2026-11-12T08:50:00Z', directive: { name: 'directiva.pdf', size: 1, pages: 14 }, resolution: { name: 'resolucion.pdf', size: 1, pages: 3 } },
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
});
