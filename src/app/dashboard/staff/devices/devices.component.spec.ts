import {TestBed} from '@angular/core/testing';
import {providePrimeNG} from 'primeng/config';
import {ConfirmationService} from 'primeng/api';
import {of, throwError} from 'rxjs';
import {InstitutionalPreset} from '../../../app.config';
import {BrowserSession, DevicesData, DevicesService} from '../../../services/devices.service';
import {deviceSummary, deviceTitle, browserIcon, platformIcon} from './device-display';
import {DevicesComponent} from './devices.component';

const session = (overrides: Partial<BrowserSession> = {}): BrowserSession => ({
  key: 'k1', current: false, device_type: 'desktop', browser: 'Chrome', platform: 'Windows', ip_address: '10.0.0.5', last_seen_at: '2026-11-25T10:48:00-05:00', started_at: null, auth_via: 'local', ...overrides,
});

describe('DevicesComponent', () => {
  let service: {list: jasmine.Spy; close: jasmine.Spy; closeOthers: jasmine.Spy};

  beforeEach(async () => {
    service = {list: jasmine.createSpy('list'), close: jasmine.createSpy('close'), closeOthers: jasmine.createSpy('closeOthers')};

    await TestBed.configureTestingModule({
      imports: [DevicesComponent],
      providers: [
        providePrimeNG({theme: {preset: InstitutionalPreset, options: {darkModeSelector: '.app-dark'}}}),
        {provide: DevicesService, useValue: service},
      ],
    }).compileComponents();
  });

  async function create(sessions: BrowserSession[], extra: Partial<DevicesData> = {}) {
    service.list.and.returnValue(of({payload: {data: {sessions, auth_via: 'local', core_devices_url: null, ...extra}}}));
    const fixture = TestBed.createComponent(DevicesComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    return {fixture, component: fixture.componentInstance, html: fixture.nativeElement as HTMLElement};
  }

  const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ');

  it('lists the devices, marks this one and does not offer to close it', async () => {
    const {html} = await create([session({key: 'me', current: true}), session({key: 'pc', browser: 'Edge'})]);
    const rows = [...html.querySelectorAll('[data-testid="device-row"]')];

    expect(rows.length).toBe(2);
    expect(text(rows[0])).toContain('Este dispositivo');
    expect(text(rows[0])).toContain('Este equipo');
    expect(rows[0].querySelector('[data-testid="close-device"]')).toBeNull();
    expect(text(rows[1])).toContain('Edge en Windows');
    expect(text(rows[1].querySelector('[data-testid="device-browser"]'))).toContain('Edge');
    expect(rows[1].querySelector('[data-testid="device-browser"] app-brand-icon')).not.toBeNull();
    expect(text(rows[1].querySelector('[data-testid="device-ip"]'))).toContain('10.0.0.5');
    expect(rows[1].querySelector('[data-testid="close-device"]')).not.toBeNull();
    expect(html.querySelector('[data-testid="close-others"]')).not.toBeNull();
  });

  it('does not offer «Cerrar en los demás» when only this device is open', async () => {
    const {html} = await create([session({current: true})]);

    expect(html.querySelector('[data-testid="close-others"]')).toBeNull();
    expect(html.querySelector('[data-testid="core-note"]')).toBeNull();
  });

  it('closes one device after confirming, shows the message of the API and reloads', async () => {
    const {component, html, fixture} = await create([session({key: 'me', current: true}), session({key: 'pc'})]);
    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    spyOn(confirmation, 'confirm').and.callFake(options => {
      options.accept?.();
      return confirmation;
    });
    service.close.and.returnValue(of({payload: {message: 'Ese dispositivo tendrá que volver a iniciar sesión.'}}));
    service.list.and.returnValue(of({payload: {data: {sessions: [session({key: 'me', current: true})], auth_via: 'local', core_devices_url: null}}}));

    (html.querySelector('[data-testid="close-device"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(service.close).toHaveBeenCalledWith('pc');
    expect(component.sessions().length).toBe(1);
    expect(text(html.querySelector('[data-testid="devices-done"]'))).toContain('volver a iniciar sesión');
  });

  it('closes all the others after confirming', async () => {
    const {html, fixture} = await create([session({key: 'me', current: true}), session({key: 'a'}), session({key: 'b'})]);
    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    let message = '';
    spyOn(confirmation, 'confirm').and.callFake(options => {
      message = options.message ?? '';
      options.accept?.();
      return confirmation;
    });
    service.closeOthers.and.returnValue(of({payload: {message: 'Se cerraron 2 sesiones en otros dispositivos.', data: {closed: 2}}}));

    (html.querySelector('[data-testid="close-others"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(message).toContain('otros 2 dispositivos');
    expect(service.closeOthers).toHaveBeenCalled();
    expect(text(html.querySelector('[data-testid="devices-done"]'))).toContain('Se cerraron 2 sesiones');
  });

  it('keeps the error of a failed close on screen', async () => {
    const {html, fixture} = await create([session({key: 'me', current: true}), session({key: 'pc'})]);
    const confirmation = fixture.debugElement.injector.get(ConfirmationService);
    spyOn(confirmation, 'confirm').and.callFake(options => {
      options.accept?.();
      return confirmation;
    });
    service.close.and.returnValue(throwError(() => ({status: 404, error: {payload: {message: 'Esa sesión ya se cerró o es la que estás usando.'}}})));

    (html.querySelector('[data-testid="close-device"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(text(html.querySelector('[data-testid="devices-error"]'))).toContain('Esa sesión ya se cerró');
  });

  it('with a session from Core, says that only Academical closes here and links to Core', async () => {
    const {html, component, fixture} = await create([session({current: true, auth_via: 'core'})], {auth_via: 'core', core_devices_url: 'https://core.test/dispositivos'});
    const navigate = spyOn(component, 'navigate');

    expect(text(html.querySelector('[data-testid="core-note"]'))).toContain('Aquí cierras solo Academical');
    (html.querySelector('[data-testid="core-devices-link"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('https://core.test/dispositivos');
  });

  it('shows the error of the list with a retry', async () => {
    service.list.and.returnValue(throwError(() => ({status: 500})));
    const fixture = TestBed.createComponent(DevicesComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;

    expect(text(html.querySelector('[data-testid="devices-error"]'))).toContain('No se pudieron cargar tus dispositivos');
    expect(html.querySelector('[data-testid="device-row"]')).toBeNull();
  });

  it('names the device and its logos like Core', () => {
    expect(deviceTitle({device_type: 'mobile', current: false})).toBe('Celular');
    expect(deviceTitle({device_type: 'tablet', current: true})).toBe('Esta tableta');
    expect(deviceSummary({browser: null, platform: 'iOS'})).toBe('Navegador desconocido en iOS');
    expect(browserIcon('Firefox')).toBe('firefox');
    expect(browserIcon('Brave')).toBe('globe');
    expect(platformIcon('macOS')).toBe('apple');
    expect(platformIcon(null)).toBe('help');
  });
});
