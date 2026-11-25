import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';

import {LoginService, SESSION_CHANNEL, SessionClosedNotice} from './login.service';
import {environment} from '../../environments/environment';

describe('LoginService', () => {
  let service: LoginService;
  let controller: HttpTestingController;
  const url = `${environment.apiUrl}/users/v1/session`;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(LoginService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
  });

  it('takes the session the browser already has, with how it was opened', () => {
    let signedIn: boolean | undefined;
    service.restore('staff').subscribe(value => (signedIn = value));

    const request = controller.expectOne(req => req.url === url);
    expect(request.request.params.get('audience')).toBe('staff');
    request.flush({status: 'success', payload: {data: {role: {value: 'hr'}, auth_via: 'core'}}});

    expect(signedIn).toBeTrue();
    expect(service.getUser()?.role.value).toBe('hr');
    expect(service.openedWithCore()).toBeTrue();
  });

  it('answers false without a session, and on any error', () => {
    const answers: boolean[] = [];
    service.restore('staff').subscribe(value => answers.push(value));
    controller.expectOne(req => req.url === url).flush({status: 'error'}, {status: 401, statusText: 'x'});
    service.restore('student').subscribe(value => answers.push(value));
    controller.expectOne(req => req.url === url).error(new ProgressEvent('offline'));

    expect(answers).toEqual([false, false]);
    expect(service.getUser()).toBeNull();
  });

  it('keeps a student session as a student', () => {
    service.restore('student').subscribe();
    controller.expectOne(req => req.url === url && req.params.get('audience') === 'student').flush({status: 'success', payload: {data: {role: {value: 'student'}}}});

    expect(service.isStudentLoggedIn()).toBeTrue();
  });

  it('signing out forgets the user and tells the other tabs', async () => {
    sessionStorage.setItem('user', JSON.stringify({role: {value: 'hr'}}));
    const other = new BroadcastChannel(SESSION_CHANNEL);
    const heard = new Promise<SessionClosedNotice & {type: string}>(resolve => (other.onmessage = event => resolve(event.data)));

    service.signOut({message: 'Tu sesión se cerró por inactividad.'});

    expect(service.getUser()).toBeNull();
    expect(await heard).toEqual(jasmine.objectContaining({type: 'closed', audience: 'staff', message: 'Tu sesión se cerró por inactividad.'}));
    other.close();
  });

  it('leaves when another tab closes the session, but only if this tab was signed in', async () => {
    const notices: SessionClosedNotice[] = [];
    service.closedElsewhere.subscribe(notice => notices.push(notice));
    const other = new BroadcastChannel(SESSION_CHANNEL);
    const delivered = () => new Promise(resolve => setTimeout(resolve, 50));

    other.postMessage({type: 'closed', audience: 'staff'});
    await delivered();
    expect(notices).toEqual([]);

    sessionStorage.setItem('user', JSON.stringify({role: {value: 'hr'}}));
    other.postMessage({type: 'closed', audience: 'staff', message: 'Cerraste sesión.'});
    await delivered();

    expect(service.getUser()).toBeNull();
    expect(notices).toEqual([jasmine.objectContaining({audience: 'staff', message: 'Cerraste sesión.'})]);
    other.close();
  });
});
