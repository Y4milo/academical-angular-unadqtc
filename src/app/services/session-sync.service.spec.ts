import {TestBed} from '@angular/core/testing';
import {Router, provideRouter} from '@angular/router';
import {Subject} from 'rxjs';

import {SessionSyncService} from './session-sync.service';
import {LoginService, SessionClosedNotice} from './login.service';
import {NotificationService} from './notification.service';
import {StaffMenuStore} from '../dashboard/staff/shared/staff-menu/staff-menu.store';
import {StudentMenuStore} from '../dashboard/student/student-menu/student-menu.store';
import {PATHS} from '../core/constants/app-paths.constants';

describe('SessionSyncService', () => {
  let closed: Subject<SessionClosedNotice>;
  let warning: jasmine.Spy;
  let navigate: jasmine.Spy;
  let staffClear: jasmine.Spy;

  beforeEach(() => {
    closed = new Subject();
    warning = jasmine.createSpy('warning');
    staffClear = jasmine.createSpy('clear');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {provide: LoginService, useValue: {closedElsewhere: closed}},
        {provide: NotificationService, useValue: {warning}},
        {provide: StaffMenuStore, useValue: {clear: staffClear}},
        {provide: StudentMenuStore, useValue: {clear: () => undefined}},
      ],
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    TestBed.inject(SessionSyncService).start();
  });

  it('takes the tab to the staff login with the reason the other tab gave', () => {
    closed.next({audience: 'staff', title: 'Sesión cerrada', message: 'Tu sesión se cerró por inactividad.'});

    expect(staffClear).toHaveBeenCalled();
    expect(warning).toHaveBeenCalledOnceWith('Sesión cerrada', 'Tu sesión se cerró por inactividad.', 8000);
    expect(navigate).toHaveBeenCalledOnceWith([PATHS.login.staff]);
  });

  it('says the session was closed in another tab when there is no reason, and sends a student to the student login', () => {
    closed.next({audience: 'student'});

    expect(warning).toHaveBeenCalledOnceWith('Sesión cerrada', 'Se cerró tu sesión en otra pestaña.', 8000);
    expect(navigate).toHaveBeenCalledOnceWith([PATHS.login.student]);
  });

  it('listens once even if started twice', () => {
    TestBed.inject(SessionSyncService).start();
    closed.next({audience: 'staff'});

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
