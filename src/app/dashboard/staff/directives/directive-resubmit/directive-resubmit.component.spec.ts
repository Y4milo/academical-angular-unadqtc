import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { detail, ok, route } from '../testing/directive-fixtures';
import { DirectiveResubmitComponent } from './directive-resubmit.component';

describe('DirectiveResubmitComponent', () => {
  let fixture: ComponentFixture<DirectiveResubmitComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let router: Router;

  const REASON = 'El artículo 5 contradice la Directiva 003-2025.';
  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const returned = (overrides = {}) =>
    detail({
      status: 'returned', status_label: 'Devuelta', can_edit: false, can_resubmit: true,
      returned: { version: 1, office: 'Asesoría Jurídica', at: '2026-11-13T08:40:00Z', person: 'Carlos Paucar', reason: REASON }, ...overrides,
    });
  const pdf = (name = 'directiva-v2.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });

  async function create() {
    fixture = TestBed.createComponent(DirectiveResubmitComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['detail', 'route', 'resubmit']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['notifyApiData', 'error']);
    service.detail.and.returnValue(of(ok(returned())));
    service.route.and.returnValue(of(ok(route({ can_send: true, issues: [] }))));
    await TestBed.configureTestingModule({
      imports: [DirectiveResubmitComponent],
      providers: [
        provideRouter([]), provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting(),
        { provide: DirectivesService, useValue: service },
        { provide: NotificationService, useValue: notifications },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('shows the shape of the screen while it loads', async () => {
    service.detail.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[data-testid="resubmit-skeleton"]')).not.toBeNull();
  });

  it('says which version it creates, shows the reason and keeps the resolution by default', async () => {
    await create();

    expect(html().querySelector('h2')?.textContent).toContain('Corregir y reenviar');
    expect(html().textContent).toContain('versión 2');
    expect(text('returned-reason')).toContain(REASON);
    expect(text('resolution-kept')).toContain('se conserva la de la versión 1');
    expect(service.route).toHaveBeenCalledWith('adm', false);
  });

  it('refuses a directive that cannot be corrected by this person', async () => {
    service.detail.and.returnValue(of(ok(returned({ can_resubmit: false }))));
    await create();

    expect(text('load-error')).toContain('no se puede corregir');
  });

  it('needs the corrected directive and shows why when it is missing', async () => {
    await create();
    fixture.componentInstance.send();
    fixture.detectChanges();

    expect(service.resubmit).not.toHaveBeenCalled();
    expect(text('error-directive')).toContain('Sube el documento corregido');
  });

  it('rejects what is not a PDF and what is too big', async () => {
    await create();
    const component = fixture.componentInstance;

    component.pick('directive', new File(['x'], 'nota.txt', { type: 'text/plain' }));
    expect(component.errors()['directive']).toContain('debe ser un PDF');
    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 });
    component.pick('directive', big);
    expect(component.errors()['directive']).toContain('el máximo es');
    component.pick('directive', pdf());
    expect(component.errors()['directive']).toBeUndefined();
  });

  it('takes the file chosen in the PrimeNG uploader and empties it so the same file can be chosen again', async () => {
    await create();
    const clear = jasmine.createSpy('clear');
    const file = pdf('elegido.pdf');

    fixture.componentInstance.pickFromUpload('directive', { currentFiles: [file], files: [file] } as never, { clear } as never);

    expect(fixture.componentInstance.directiveFile()?.name).toBe('elegido.pdf');
    expect(clear).toHaveBeenCalled();
  });

  it('sends the corrected directive without a resolution when none is chosen and goes back to the directive', async () => {
    service.resubmit.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', version: 2 }))));
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await create();
    fixture.componentInstance.directiveFile.set(pdf());

    fixture.componentInstance.send();

    const body = service.resubmit.calls.mostRecent().args[1] as FormData;
    expect(service.resubmit.calls.mostRecent().args[0]).toBe(7);
    expect((body.get('directive') as File).name).toBe('directiva-v2.pdf');
    expect(body.has('resolution')).toBeFalse();
    expect(notifications.notifyApiData).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('directivas/7');
  });

  it('sends a new resolution only when one is chosen, and can go back to the previous one', async () => {
    service.resubmit.and.returnValue(of(ok(detail({ status: 'in_signature', status_label: 'En firma', version: 2 }))));
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await create();
    const component = fixture.componentInstance;
    component.directiveFile.set(pdf());
    component.resolutionFile.set(pdf('resolucion-nueva.pdf'));
    fixture.detectChanges();
    expect(text('resolution-file')).toContain('reemplaza a la anterior');

    component.keepResolution();
    fixture.detectChanges();
    expect(text('resolution-kept')).toContain('se conserva');

    component.resolutionFile.set(pdf('resolucion-nueva.pdf'));
    component.send();
    expect(((service.resubmit.calls.mostRecent().args[1] as FormData).get('resolution') as File).name).toBe('resolucion-nueva.pdf');
  });

  it('shows what the server said when it cannot resend and stays on the page', async () => {
    service.resubmit.and.returnValue(throwError(() => ({ status: 409, error: { payload: { message: 'Core no tiene a nadie designado en una oficina de la ruta.' } } })));
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    await create();
    fixture.componentInstance.directiveFile.set(pdf());

    fixture.componentInstance.send();
    fixture.detectChanges();

    expect(text('server-error')).toContain('Core no tiene a nadie designado');
    expect(fixture.componentInstance.sending()).toBeFalse();
    expect(navigate).not.toHaveBeenCalled();
  });
  it('has the tracking button in its header, like the other screens of the module', async () => {
    await create();

    expect(html().querySelector('[data-testid="tracking-button"]')).not.toBeNull();
  });

  describe('redesigned screen', () => {
    it('has breadcrumbs, the next version as a tag and the reason of the return as a warning', async () => {
      await create();

      expect(text('breadcrumb')).toContain('Documentos de gestión');
      expect(text('breadcrumb')).toContain('Corregir y reenviar');
      expect(text('next-version')).toContain('Versión');
      expect(text('returned-reason')).toContain('Por qué se devolvió');
      expect(html().querySelector('[data-testid="returned-reason"] .p-message-warn')).not.toBeNull();
    });

    it('explains what will happen: the new version, the route from zero and the notice to the origin office', async () => {
      await create();
      const steps = Array.from(html().querySelectorAll('[data-testid="what-step"]')).map(step => step.textContent ?? '');

      expect(steps.length).toBe(3);
      expect(steps[0]).toContain('Se crea la versión');
      expect(steps[1]).toContain('La ruta empieza de cero');
      expect(steps[2]).toContain('Se avisa a la oficina de origen');
    });

    it('keeps the resolution with a switch and only offers the uploader when it is turned off', async () => {
      await create();
      expect(fixture.componentInstance.keepCurrent()).toBeTrue();
      expect(html().querySelector('[data-testid="pick-resolution"]')).toBeNull();

      fixture.componentInstance.setKeep(false);
      fixture.detectChanges();
      expect(fixture.componentInstance.keepCurrent()).toBeFalse();
      expect(html().querySelector('[data-testid="pick-resolution"]')).not.toBeNull();

      fixture.componentInstance.keepResolution();
      fixture.detectChanges();
      expect(fixture.componentInstance.keepCurrent()).toBeTrue();
      expect(html().querySelector('[data-testid="pick-resolution"]')).toBeNull();
    });

    it('has the sticky toolbar with the send button and the warning that it cannot be undone', async () => {
      await create();

      expect(text('action-bar')).toContain('No se puede deshacer una vez enviado');
      expect(html().querySelector('[data-testid="action-bar"] [data-testid="resubmit-send"]')).not.toBeNull();
    });
  });
});
