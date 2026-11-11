import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { DirectiveSettings, DirectivesService } from '../../../../services/directives.service';
import { NotificationService } from '../../../../services/notification.service';
import { ok } from '../testing/directive-fixtures';
import { DirectiveSettingsComponent } from './directive-settings.component';

describe('DirectiveSettingsComponent', () => {
  let fixture: ComponentFixture<DirectiveSettingsComponent>;
  let service: jasmine.SpyObj<DirectivesService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  const defaults = { pending_docs: 'yes', signed_versions: 'own', reason_visibility: 'origin', notify_turn: 'yes', notify_returned: 'yes', notify_void: 'yes', notify_completed: 'yes', notify_cancelled: 'yes', role_quality: 'visto_bueno', role_legal: 'visto_bueno', role_modernization: 'visto_bueno', role_presidency: 'visto_bueno' } as const;
  const settings = (overrides: Partial<DirectiveSettings> = {}): DirectiveSettings => ({ values: { ...defaults }, defaults: { ...defaults }, history: [], ...overrides });
  const html = () => fixture.nativeElement as HTMLElement;
  /** El registro de cambios vive en un cajón de PrimeNG que se pega al `body`: se busca en la pantalla y, si no está, en la página. */
  const find = (testId: string) => html().querySelector(`[data-testid="${testId}"]`) ?? document.body.querySelector(`[data-testid="${testId}"]`);
  const text = (testId: string) => find(testId)?.textContent?.trim() ?? '';
  const saveButton = () => html().querySelector('[data-testid="save-settings"] button') as HTMLButtonElement;

  async function create() {
    fixture = TestBed.createComponent(DirectiveSettingsComponent);
    fixture.autoDetectChanges();
    // Las pruebas abren el cajón del registro de cambios para leerlo, como hace la persona con el botón.
    fixture.componentInstance.historyOpen.set(true);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<DirectivesService>('DirectivesService', ['settings', 'updateSettings']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['notifyApiData', 'error']);
    service.settings.and.returnValue(of(ok(settings())));
    await TestBed.configureTestingModule({
      imports: [DirectiveSettingsComponent],
      providers: [provideNoopAnimations(), { provide: DirectivesService, useValue: service }, { provide: NotificationService, useValue: notifications }],
    }).compileComponents();
  });

  it('shows the shape of the screen while it loads', async () => {
    service.settings.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[data-testid="settings-skeleton"]')).not.toBeNull();
  });

  it('shows the three rules with their saved values and nothing to save', async () => {
    await create();

    expect(html().querySelectorAll('[data-testid^="rule-"]').length).toBe(3);
    expect(text('rule-pending_docs')).toContain('Pueden ver los PDF');
    expect(text('settings-state')).toBe('Sin cambios sin guardar.');
    expect(saveButton().disabled).toBeTrue();
    expect(text('history-empty')).toContain('valores predeterminados');
  });

  it('explains how an office without its turn would see it as the rules change', async () => {
    await create();
    expect(text('preview-text')).toContain('puede consultar los PDF');
    expect(text('preview-text')).toContain('no el motivo');

    fixture.componentInstance.choose('pending_docs', 'no');
    fixture.componentInstance.choose('reason_visibility', 'route');
    fixture.detectChanges();

    expect(text('preview-text')).toContain('no ve los PDF');
    expect(text('preview-text')).toContain('ve el motivo');
    expect(text('settings-state')).toBe('Hay cambios sin guardar.');
    expect(saveButton().disabled).toBeFalse();
  });

  it('saves only when something changed and shows the new history', async () => {
    const saved = settings({
      values: { ...defaults, pending_docs: 'no' },
      history: [{ key: 'pending_docs', old: 'yes', new: 'no', by: 'admin', at: '2026-11-16T09:30:00Z' }],
    });
    service.updateSettings.and.returnValue(of(ok(saved)));
    await create();

    fixture.componentInstance.save();
    expect(service.updateSettings).not.toHaveBeenCalled();

    fixture.componentInstance.choose('pending_docs', 'no');
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(service.updateSettings).toHaveBeenCalledOnceWith({ ...defaults, pending_docs: 'no' });
    expect(notifications.notifyApiData).toHaveBeenCalled();
    expect(text('settings-state')).toBe('Sin cambios sin guardar.');
    expect(text('history-row')).toContain('Documentos sin turno');
    expect(text('history-row')).toContain('Pueden ver los PDF → Solo el estado');
    expect(text('history-row')).toContain('admin');
  });

  it('shows the five kinds of notice, all on, and a change in one is a change to save', async () => {
    await create();

    expect(html().querySelectorAll('[data-testid^="notice-"]').length).toBe(5);
    expect(text('notice-notify_cancelled')).toContain('Documento anulado');
    expect(text('notice-notify_void')).toContain('Firma sin efecto');
    expect(fixture.componentInstance.dirty()).toBeFalse();

    fixture.componentInstance.toggleNotice('notify_void', false);
    fixture.detectChanges();

    expect(fixture.componentInstance.values()?.notify_void).toBe('no');
    expect(fixture.componentInstance.dirty()).toBeTrue();
    expect(saveButton().disabled).toBeFalse();
  });

  it('saves the notice switches with the rest and names them in the history', async () => {
    service.updateSettings.and.returnValue(of(ok(settings({
      values: { ...defaults, notify_turn: 'no' },
      history: [{ key: 'notify_turn', old: 'yes', new: 'no', by: 'admin', at: '2026-11-16T09:30:00Z' }],
    }))));
    await create();

    fixture.componentInstance.toggleNotice('notify_turn', false);
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(service.updateSettings).toHaveBeenCalledOnceWith({ ...defaults, notify_turn: 'no' });
    expect(text('history-row')).toContain('Aviso: le toca firmar');
    expect(text('history-row')).toContain('Encendido → Apagado');
  });

  it('goes back to the defaults without saving', async () => {
    service.settings.and.returnValue(of(ok(settings({ values: { ...defaults, signed_versions: 'all' } }))));
    await create();

    fixture.componentInstance.reset();

    expect(fixture.componentInstance.values()?.signed_versions).toBe('own');
    expect(fixture.componentInstance.dirty()).toBeTrue();
    expect(service.updateSettings).not.toHaveBeenCalled();
  });

  it('shows what the server said when it cannot save', async () => {
    service.updateSettings.and.returnValue(throwError(() => ({ status: 403, error: { payload: { message: 'No tiene permisos para acceder a este recurso.' } } })));
    await create();
    fixture.componentInstance.choose('signed_versions', 'all');

    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(text('save-error')).toContain('No tiene permisos');
    expect(fixture.componentInstance.saving()).toBeFalse();
  });

  it('tells who is not an administrator and offers no form', async () => {
    service.settings.and.returnValue(throwError(() => ({ status: 403 })));
    await create();

    expect(text('load-error')).toContain('Solo el administrador del sistema');
    expect(html().querySelector('[data-testid="rule-pending_docs"]')).toBeNull();
  });

  it('puts the change log behind a button with the number of changes', async () => {
    service.settings.and.returnValue(of(ok(settings({ history: [{ key: 'pending_docs', old: 'yes', new: 'no', by: 'admin', at: '2026-11-16T09:30:00Z' }] }))));
    await create();
    fixture.componentInstance.historyOpen.set(false);
    fixture.detectChanges();

    expect(html().querySelector('[data-testid="history-button"]')!.textContent).toContain('Registro de cambios');
    expect(text('history-count')).toBe('1');
    expect(html().querySelector('section[data-testid="history-panel"]')).toBeNull();
  });

  describe('redesigned screen', () => {
    it('has breadcrumbs back to the list of documents and the vocabulary of the mockup', async () => {
      await create();

      expect(text('breadcrumb')).toContain('Documentos de gestión');
      expect(text('breadcrumb')).toContain('Visibilidad de documentos');
      expect(text('rule-pending_docs')).toContain('Oficinas que aún no les toca');
      expect(text('rule-reason_visibility')).toContain('Motivo de la devolución');
      expect(text('notice-notify_completed')).toContain('Documento firmado por todas');
    });

    it('keeps the preview card apart from the rules and the actions in a toolbar', async () => {
      await create();

      expect(html().querySelector('[data-testid="preview-panel"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="action-bar"] [data-testid="save-settings"]')).not.toBeNull();
      expect(html().querySelector('[data-testid="action-bar"] [data-testid="discard-settings"]')).not.toBeNull();
      expect(text('settings-state')).toBe('Sin cambios sin guardar.');
    });

    it('discards what was chosen and goes back to the last saved values', async () => {
      await create();
      const component = fixture.componentInstance;
      component.choose('pending_docs', 'no');
      fixture.detectChanges();
      expect(component.dirty()).toBeTrue();
      expect(text('settings-state')).toBe('Hay cambios sin guardar.');

      component.discard();
      fixture.detectChanges();
      expect(component.dirty()).toBeFalse();
      expect(component.values()?.pending_docs).toBe('yes');
    });
  });

  it('lets the administrator choose visto bueno or approval per office, with the origin fixed as author, and saves it with the rest', async () => {
    service.updateSettings.and.returnValue(of(ok(settings({ values: { ...defaults, role_presidency: 'aprobacion' } }))));
    await create();

    expect(text('role-origin')).toContain('Autor del documento');
    expect(html().querySelectorAll('[data-testid^="role-role_"]').length).toBe(4);
    fixture.componentInstance.choose('role_presidency', 'aprobacion');
    expect(fixture.componentInstance.dirty()).toBeTrue();
    fixture.componentInstance.save();

    expect(service.updateSettings).toHaveBeenCalledOnceWith({ ...defaults, role_presidency: 'aprobacion' });
  });
});
