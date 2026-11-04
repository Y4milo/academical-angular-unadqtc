import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginService } from '../../../services/login.service';
import { CoreEntryComponent } from './core-entry.component';
import { CoreReturnComponent } from './core-return.component';
import { CORE_SSO_GENERIC_ERROR, CoreSsoService, coreSsoErrorMessage } from './core-sso.service';

describe('Core sign-in', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  describe('entry from Core', () => {
    it('goes straight to Core when Academical is integrated with it', () => {
      const goTo = spyOn(TestBed.inject(CoreSsoService), 'goTo');
      TestBed.createComponent(CoreEntryComponent).detectChanges();

      http.expectOne('/api/auth/core/status').flush({ enabled: true });

      expect(goTo).toHaveBeenCalledOnceWith('/api/auth/core/redirect');
    });

    it('shows the usual login when Academical is not integrated with Core', () => {
      const goTo = spyOn(TestBed.inject(CoreSsoService), 'goTo');
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(CoreEntryComponent).detectChanges();

      http.expectOne('/api/auth/core/status').flush({ enabled: false });

      expect(goTo).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/', 'login-admin']);
    });

    it('shows the usual login when Academical cannot tell whether it is integrated', () => {
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(CoreEntryComponent).detectChanges();

      http.expectOne('/api/auth/core/status').flush('', { status: 500, statusText: 'Server Error' });

      expect(navigate).toHaveBeenCalledWith(['/', 'login-admin']);
    });
  });

  describe('return from Core', () => {
    const session = (role: string) => ({ status: 'success', encoded: false, decoded: true, payload: { title: '', message: '', data: { id: 1, role: { value: role } } } });

    it('builds the browser session and goes to the home of the role', () => {
      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      TestBed.createComponent(CoreReturnComponent).detectChanges();

      http.expectOne('/api/auth/core/session').flush(session('hr'));

      expect(TestBed.inject(LoginService).getUser()?.role.value).toBe('hr');
      expect(navigate).toHaveBeenCalledWith('hr/home');
    });

    it('goes back to the login saying so when there is no session', () => {
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(CoreReturnComponent).detectChanges();

      http.expectOne('/api/auth/core/session').flush('', { status: 401, statusText: 'Unauthorized' });

      expect(TestBed.inject(LoginService).getUser()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/', 'login-admin'], { queryParams: { core_error: 'invalid_response' } });
    });
  });

  describe('messages of a failed sign-in', () => {
    it('explains each known reason and falls back to a generic one', () => {
      expect(coreSsoErrorMessage(null)).toBe('');
      expect(coreSsoErrorMessage('not_linked')).toContain('no está vinculada');
      expect(coreSsoErrorMessage('inactive')).toContain('inactivo');
      expect(coreSsoErrorMessage('something_new')).toBe(CORE_SSO_GENERIC_ERROR);
    });
  });
});
