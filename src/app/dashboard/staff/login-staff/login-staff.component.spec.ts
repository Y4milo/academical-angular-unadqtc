import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
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
        provideNoopAnimations(),
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
  const html = (fixture: { nativeElement: HTMLElement }) => fixture.nativeElement;
  const hasLogin = (fixture: { nativeElement: HTMLElement }) => html(fixture).querySelector('app-login-base') !== null;

  afterEach(() => http.verify());

  it('should create', () => {
    const fixture = create();
    http.expectOne('/api/auth/core/status').flush({ enabled: false });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('waits for the decision instead of flashing the login', () => {
    const fixture = create();

    expect(hasLogin(fixture)).toBeFalse();
    expect(html(fixture).querySelector('[data-testid="core-redirecting"]')).not.toBeNull();
    http.expectOne('/api/auth/core/status').flush({ enabled: false });
  });

  it('shows the usual login when the Core sign-in is not required', () => {
    const fixture = create();
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: false });
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeTrue();
  });

  it('never shows the login of Academical and goes to Core when Core is required', () => {
    const fixture = create();
    http.expectOne('/api/auth/core/status').flush({ enabled: true, required: true, portal_url: 'https://core.test' });
    fixture.detectChanges();

    expect(goTo).toHaveBeenCalledOnceWith('/api/auth/core/redirect');
    expect(hasLogin(fixture)).toBeFalse();
    expect(html(fixture).textContent).toContain('Te llevamos a Core');
  });

  it('brings the usual login back when it cannot tell whether Core is required (emergency exit)', () => {
    const fixture = create();
    http.expectOne('/api/auth/core/status').flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(hasLogin(fixture)).toBeTrue();
    expect(goTo).not.toHaveBeenCalled();
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
