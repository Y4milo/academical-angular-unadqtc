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
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['detail', 'route', 'file', 'remove']);
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

  it('keeps sending disabled and says why: Core has nobody in an office, or the signer is not connected', async () => {
    await create();
    const button = html().querySelector('[data-testid="send-directive"] button') as HTMLButtonElement;

    expect(button.disabled).toBeTrue();
    expect(fixture.componentInstance.sendBlockedReason()).toContain('Core no tiene a alguien designado');

    service.route.and.returnValue(of(ok(route({ can_send: true, issues: [] }))));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.componentInstance.sendBlockedReason()).toContain('firmador');
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
    expect(service.file).toHaveBeenCalledWith(7, 'resolution');
    expect(tab.location.href).toBe('blob:pdf');

    service.file.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.componentInstance.openFile('directive');
    expect(tab.close).toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalled();
  });

  it('says so when the directive is not found or not of the office', async () => {
    service.detail.and.returnValue(throwError(() => ({ status: 404 })));
    await create();

    expect(text('load-error')).toContain('No encontramos esa directiva');
  });
});
