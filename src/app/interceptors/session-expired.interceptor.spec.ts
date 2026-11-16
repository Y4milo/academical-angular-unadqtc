import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { NotificationService } from '../services/notification.service';
import { sessionExpiredInterceptor } from './session-expired.interceptor';

describe('sessionExpiredInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let navigate: jasmine.Spy;
  let removeUser: jasmine.Spy;
  let warning: jasmine.Spy;
  let signedIn: boolean;

  beforeEach(() => {
    signedIn = true;
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    removeUser = jasmine.createSpy('removeUser');
    warning = jasmine.createSpy('warning');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionExpiredInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate, url: '/hr/home' } },
        { provide: LoginService, useValue: { getUser: () => (signedIn ? { role: { value: 'hr' } } : null), removeUser } },
        { provide: NotificationService, useValue: { warning } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  const fail = (body: object, status = 401) => {
    http.get('/api/anything').subscribe({ error: () => undefined });
    controller.expectOne('/api/anything').flush(body, { status, statusText: 'x' });
  };

  it('tells the person why the session ended when the API gives a reason', () => {
    fail({ status: 'error', payload: { title: 'Sesión cerrada', message: 'Tu sesión de Core se cerró, así que también se cerró la de Academical. Vuelve a ingresar.', reason: 'core_closed' } });

    expect(warning).toHaveBeenCalledOnceWith('Sesión cerrada', 'Tu sesión de Core se cerró, así que también se cerró la de Academical. Vuelve a ingresar.', 8000);
    expect(removeUser).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
  });

  it('still leaves the screen without a message when the API gives no reason', () => {
    fail({ message: 'Unauthenticated.' });

    expect(warning).not.toHaveBeenCalled();
    expect(removeUser).toHaveBeenCalled();
  });

  it('does not show the message to someone who was not signed in', () => {
    signedIn = false;
    fail({ status: 'error', payload: { message: 'Tu sesión se cerró por inactividad.', reason: 'idle' } });

    expect(warning).not.toHaveBeenCalled();
  });

  it('ignores other errors', () => {
    fail({ message: 'boom' }, 500);

    expect(warning).not.toHaveBeenCalled();
    expect(removeUser).not.toHaveBeenCalled();
  });
});
