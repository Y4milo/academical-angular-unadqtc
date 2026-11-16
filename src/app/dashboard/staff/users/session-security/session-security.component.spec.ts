import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { NotificationService } from '../../../../services/notification.service';
import { SessionSecurityService, SessionSecuritySettings } from '../../../../services/session-security.service';
import { ok } from '../../directives/testing/directive-fixtures';
import { SessionSecurityComponent } from './session-security.component';

describe('SessionSecurityComponent', () => {
  let fixture: ComponentFixture<SessionSecurityComponent>;
  let service: jasmine.SpyObj<SessionSecurityService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  const settings = (overrides: Partial<SessionSecuritySettings> = {}): SessionSecuritySettings => ({
    values: { idle_minutes: 20, max_hours: 12, warning_seconds: 60, source: 'default' },
    defaults: { idle_minutes: 20, max_hours: 12, warning_seconds: 60 },
    limits: { idle_minutes: [5, 240], max_hours: [1, 24], warning_seconds: [30, 180] },
    ...overrides,
  });
  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const saveButton = () => html().querySelector('[data-testid="save-settings"] button') as HTMLButtonElement;
  const input = (key: string) => html().querySelector(`#input-${key}`) as HTMLInputElement;

  async function create() {
    fixture = TestBed.createComponent(SessionSecurityComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  async function type(key: string, value: string) {
    const field = input(key);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<SessionSecurityService>('SessionSecurityService', ['settings', 'update']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['notifyApiData', 'error']);
    service.settings.and.returnValue(of(ok(settings())));
    await TestBed.configureTestingModule({
      imports: [SessionSecurityComponent],
      providers: [provideNoopAnimations(), { provide: SessionSecurityService, useValue: service }, { provide: NotificationService, useValue: notifications }],
    }).compileComponents();
  });

  it('shows the shape of the screen while it loads', async () => {
    service.settings.and.returnValue(new Subject());
    await create();

    expect(html().querySelector('[data-testid="settings-skeleton"]')).not.toBeNull();
  });

  it('says it is only for the administrator when the server refuses', async () => {
    service.settings.and.returnValue(throwError(() => ({ status: 403 })));
    await create();

    expect(text('load-error')).toContain('Solo el administrador');
  });

  it('shows each time with its range and explains what the choice means', async () => {
    await create();

    expect(text('field-idle_minutes')).toContain('De 5 a 240 minutos');
    expect(text('field-max_hours')).toContain('De 1 a 24 horas');
    expect(text('field-warning_seconds')).toContain('De 30 a 180 segundos');
    expect(text('effect-text')).toContain('20 minutos sin actividad');
    expect(text('effect-text')).toContain('12 horas');
    expect(text('source-tag')).toBe('Valores recomendados');
  });

  it('does not save until something changes', async () => {
    await create();

    expect(saveButton().disabled).toBeTrue();
    expect(text('settings-state')).toBe('Sin cambios sin guardar.');
  });

  it('saves the new times and shows what the server kept', async () => {
    service.update.and.returnValue(of(ok(settings({ values: { idle_minutes: 10, max_hours: 8, warning_seconds: 60, source: 'database' } }))));
    await create();

    await type('idle_minutes', '10');
    await type('max_hours', '8');
    expect(text('settings-state')).toBe('Tienes cambios sin guardar.');
    expect(saveButton().disabled).toBeFalse();

    saveButton().click();
    await fixture.whenStable();

    expect(service.update).toHaveBeenCalledOnceWith({ idle_minutes: 10, max_hours: 8, warning_seconds: 60 });
    expect(notifications.notifyApiData).toHaveBeenCalled();
    expect(text('source-tag')).toBe('Valores guardados');
    expect(saveButton().disabled).toBeTrue();
  });

  it('discards the changes and can go back to the recommended values', async () => {
    service.settings.and.returnValue(of(ok(settings({ values: { idle_minutes: 15, max_hours: 8, warning_seconds: 60, source: 'database' } }))));
    await create();

    (html().querySelector('[data-testid="use-defaults"] button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(text('effect-text')).toContain('20 minutos sin actividad');
    expect(text('settings-state')).toBe('Tienes cambios sin guardar.');

    (html().querySelector('[data-testid="reset-settings"] button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(text('effect-text')).toContain('15 minutos sin actividad');
    expect(text('settings-state')).toBe('Sin cambios sin guardar.');
  });

  it('shows the server message when saving fails', async () => {
    service.update.and.returnValue(throwError(() => ({ error: { payload: { message: 'El valor no es válido.' } } })));
    await create();

    await type('idle_minutes', '10');
    saveButton().click();
    await fixture.whenStable();

    expect(text('save-error')).toContain('El valor no es válido.');
  });
});
