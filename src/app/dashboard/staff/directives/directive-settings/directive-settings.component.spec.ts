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

  const defaults = { pending_docs: 'yes', signed_versions: 'own', reason_visibility: 'origin', notify_turn: 'yes', notify_returned: 'yes', notify_void: 'yes', notify_completed: 'yes', notify_cancelled: 'yes' } as const;
  const settings = (overrides: Partial<DirectiveSettings> = {}): DirectiveSettings => ({ values: { ...defaults }, defaults: { ...defaults }, history: [], ...overrides });
  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const saveButton = () => html().querySelector('[data-testid="save-settings"] button') as HTMLButtonElement;

  async function create() {
    fixture = TestBed.createComponent(DirectiveSettingsComponent);
    fixture.autoDetectChanges();
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
    expect(text('settings-state')).toBe('Tienes cambios sin guardar.');
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
    expect(text('notice-notify_cancelled')).toContain('Directiva anulada');
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
});
