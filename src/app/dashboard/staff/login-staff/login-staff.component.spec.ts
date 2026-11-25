import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { CoreSsoService } from '../core-sso/core-sso.service';
import { LoginStaffComponent } from './login-staff.component';

describe('LoginStaffComponent', () => {
  let http: HttpTestingController;
  let goTo: jasmine.Spy;

  const create = (query: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [LoginStaffComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    goTo = spyOn(TestBed.inject(CoreSsoService), 'goTo');
    const fixture = TestBed.createComponent(LoginStaffComponent);
    fixture.detectChanges();
    return fixture;
  };
  /** Without a session in the browser (the usual case for the login), the API answers 401 to «who am I». */
  const noSession = () => http.expectOne(req => req.url === '/api/users/v1/session').flush({ status: 'error' }, { status: 401, statusText: 'x' });
  const html = (fixture: { nativeElement: HTMLElement }) => fixture.nativeElement;
  const hasLogin = (fixture: { nativeElement: HTMLElement }) => html(fixture).querySelector('app-login-base') !== null;

  afterEach(() => http.verify());

  it('should create', () => {
    const fixture = create();
    noSession();
    http.expectOne('/api/auth/core/status').flush({ enabled: false });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('waits for the decision instead of flashing the login', () => {
    const fixture = create();
    noSession();

    expect(hasLogin(fixture)).toBeFalse();
    expect(html(fixture).querySelector('[data-testid="core-redirecting"]')).not.toBeNull();
    http.expectOne('/api/auth/core/status').flush({ enabled: false });
  });

  it('shows the usual login when the Core sign-in is not required', () => {
    const fixture = create();
    noSession();
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: false });
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeTrue();
  });

  it('never shows the login of Academical and goes to Core when Core is required', () => {
    const fixture = create();
    noSession();
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: true, portal_url: 'https://core.test' });
    fixture.detectChanges();

    expect(goTo).toHaveBeenCalledTimes(1);
    expect(goTo.calls.mostRecent().args[0]).toMatch(/^\/api\/auth\/core\/redirect\?nonce=[A-Za-z0-9_-]{43}$/);
    expect(hasLogin(fixture)).toBeFalse();
    expect(html(fixture).textContent).toContain('Te llevamos a Core');
  });

  it('brings the usual login back when it cannot tell whether Core is required (emergency exit)', () => {
    const fixture = create();
    noSession();
    http.expectOne('/api/auth/core/status').flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeTrue();
    expect(goTo).not.toHaveBeenCalled();
  });

  it('goes straight in when another tab of the browser already signed in', () => {
    const fixture = create();
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    http.expectOne(req => req.url === '/api/users/v1/session').flush({ status: 'success', payload: { data: { role: { value: 'hr' }, auth_via: 'local' } } });
    fixture.detectChanges();

    http.expectNone('/api/auth/core/status');
    expect(hasLogin(fixture)).toBeFalse();
    expect(navigate).toHaveBeenCalled();
  });

  it('shows the result page, not the login, when the person comes back from Core without a session', () => {
    const fixture = create({ core_error: 'not_linked' });
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: true, portal_url: 'https://core.test' });
    fixture.detectChanges();
    http.expectOne('/api/auth/core/failure').flush({ failure: null });
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeFalse();
    expect(html(fixture).querySelector('[data-testid="result-title"]')?.textContent).toContain('aún no está vinculada');
    expect(html(fixture).querySelector('[data-testid="use-local-login"]')).toBeNull();
  });

  it('lets the person fall back to the usual login from the result page only when Core is optional', () => {
    const fixture = create({ core_error: 'inactive' });
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: false });
    fixture.detectChanges();
    http.expectOne('/api/auth/core/failure').flush({ failure: null });
    fixture.detectChanges();

    (html(fixture).querySelector('[data-testid="use-local-login"] button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeTrue();
  });
});
