import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
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

    /** La dirección de retorno trae `?code=`: se pone en la ruta activa que ya tiene el módulo de pruebas. */
    const withCode = (code: string | null) =>
      Object.defineProperty(TestBed.inject(ActivatedRoute).snapshot, 'queryParamMap', { value: convertToParamMap(code === null ? {} : { code }), configurable: true });

    it('swaps the one-use code of the address for the session and goes to the home of the role', () => {
      withCode('one-use-code');
      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      TestBed.createComponent(CoreReturnComponent).detectChanges();

      const exchange = http.expectOne('/api/auth/core/exchange');
      expect(exchange.request.method).toBe('POST');
      expect(exchange.request.body).toEqual({ code: 'one-use-code' });
      exchange.flush(session('hr'));

      expect(TestBed.inject(LoginService).getUser()?.role.value).toBe('hr');
      expect(navigate).toHaveBeenCalledWith('hr/home');
    });

    it('goes back to the login when the code expired or was already used', () => {
      withCode('old-code');
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(CoreReturnComponent).detectChanges();

      http.expectOne('/api/auth/core/exchange').flush({ status: 'warning' }, { status: 422, statusText: 'Unprocessable Entity' });

      expect(TestBed.inject(LoginService).getUser()).toBeNull();
      expect(navigate).toHaveBeenCalledWith(['/', 'login-admin'], { queryParams: { core_error: 'invalid_response' } });
    });

    it('asks for the session the API already opened when the address has no code (API before the one-use code)', () => {
      withCode(null);
      const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
      TestBed.createComponent(CoreReturnComponent).detectChanges();

      http.expectNone('/api/auth/core/exchange');
      http.expectOne('/api/auth/core/session').flush(session('hr'));

      expect(navigate).toHaveBeenCalledWith('hr/home');
    });

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
