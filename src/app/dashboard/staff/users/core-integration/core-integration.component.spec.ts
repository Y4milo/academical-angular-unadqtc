import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { CoreIntegrationService, CoreIntegrationSettings } from '../../../../services/core-integration.service';
import { NotificationService } from '../../../../services/notification.service';
import { ok } from '../../directives/testing/directive-fixtures';
import { CoreIntegrationComponent } from './core-integration.component';

describe('CoreIntegrationComponent', () => {
  let fixture: ComponentFixture<CoreIntegrationComponent>;
  let service: jasmine.SpyObj<CoreIntegrationService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  const settings = (overrides: Partial<CoreIntegrationSettings> = {}): CoreIntegrationSettings => ({
    values: { sso: 'off', mode: 'optional' },
    defaults: { sso: 'off', mode: 'optional' },
    checks: {
      client: { ok: true, label: 'Cliente de ingreso configurado', detail: 'Dirección de Core, cliente y retorno completos.' },
      linked: { ok: true, label: 'Cuentas vinculadas a Core', detail: '12 cuentas de Academical vinculadas a una persona de Core.' },
      reachable: { ok: false, label: 'Core responde', detail: 'Core no contestó.' },
    },
    history: [],
    ...overrides,
  });
  const html = () => fixture.nativeElement as HTMLElement;
  const text = (testId: string) => html().querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
  const saveButton = () => html().querySelector('[data-testid="save-settings"] button') as HTMLButtonElement;

  async function create() {
    fixture = TestBed.createComponent(CoreIntegrationComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    service = jasmine.createSpyObj<CoreIntegrationService>('CoreIntegrationService', ['settings', 'update']);
    notifications = jasmine.createSpyObj<NotificationService>('NotificationService', ['notifyApiData', 'error']);
    service.settings.and.returnValue(of(ok(settings())));
    await TestBed.configureTestingModule({
      imports: [CoreIntegrationComponent],
      providers: [provideNoopAnimations(), { provide: CoreIntegrationService, useValue: service }, { provide: NotificationService, useValue: notifications }],
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

  it('shows what the server says is ready and what is not', async () => {
    await create();

    expect(text('check-client')).toContain('Listo');
    expect(text('check-reachable')).toContain('Pendiente');
    expect(text('check-linked')).toContain('12 cuentas');
  });

  it('explains what each choice does to the sign-in', async () => {
    await create();
    expect(text('effect-text')).toContain('solo con usuario y contraseña');

    fixture.componentInstance.toggleSso(true);
    fixture.detectChanges();
    expect(text('effect-text')).toContain('sigue el ingreso con usuario y contraseña');

    fixture.componentInstance.chooseMode('required');
    fixture.detectChanges();
    expect(text('effect-text')).toContain('no aparece');
    expect(text('effect-text')).toContain('Si Core no responde');
  });

  it('only lets save when something changed and sends only the choices', async () => {
    service.update.and.returnValue(of(ok(settings({ values: { sso: 'on', mode: 'optional' } }))));
    await create();
    expect(saveButton().disabled).toBeTrue();

    fixture.componentInstance.toggleSso(true);
    fixture.detectChanges();
    expect(saveButton().disabled).toBeFalse();
    expect(text('settings-state')).toContain('cambios sin guardar');

    saveButton().click();
    await fixture.whenStable();

    expect(service.update).toHaveBeenCalledWith({ sso: 'on', mode: 'optional' });
    expect(notifications.notifyApiData).toHaveBeenCalled();
    expect(fixture.componentInstance.dirty()).toBeFalse();
  });

  it('shows the reason the server gives when it refuses to save', async () => {
    service.update.and.returnValue(throwError(() => ({ error: { payload: { message: 'Tu cuenta no está vinculada a Core: con el modo obligatorio no podrías volver a entrar.' } } })));
    await create();
    fixture.componentInstance.toggleSso(true);
    fixture.componentInstance.chooseMode('required');
    fixture.detectChanges();

    saveButton().click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text('save-error')).toContain('no podrías volver a entrar');
    expect(fixture.componentInstance.dirty()).toBeTrue();
  });

  it('can discard the changes', async () => {
    await create();
    fixture.componentInstance.toggleSso(true);
    fixture.detectChanges();

    (html().querySelector('[data-testid="reset-settings"] button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values()).toEqual({ sso: 'off', mode: 'optional' });
  });

  it('lists who changed what, with the previous value', async () => {
    service.settings.and.returnValue(of(ok(settings({ history: [{ key: 'mode', old: 'optional', new: 'required', by: 'admin', at: '2026-11-04T10:00:00Z' }] }))));
    await create();

    expect(text('history-row')).toContain('Modo de ingreso');
    expect(text('history-row')).toContain('Opcional → Obligatorio');
    expect(text('history-row')).toContain('admin');
  });
});
