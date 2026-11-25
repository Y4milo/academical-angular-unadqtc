import {Injectable, inject} from '@angular/core';
import {Router} from '@angular/router';
import {PATHS} from '../core/constants/app-paths.constants';
import {StaffMenuStore} from '../dashboard/staff/shared/staff-menu/staff-menu.store';
import {StudentMenuStore} from '../dashboard/student/student-menu/student-menu.store';
import {LoginService, SessionClosedNotice} from './login.service';
import {NotificationService} from './notification.service';

/**
 * When another tab of this browser closes the session (the person signed out there, or the API said it ended), this tab leaves too: it clears
 * the menu, says why and goes to the login of its audience. Started once when the app starts (app.config.ts).
 */
@Injectable({providedIn: 'root'})
export class SessionSyncService {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly staffMenu = inject(StaffMenuStore);
  private readonly studentMenu = inject(StudentMenuStore);
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.loginService.closedElsewhere.subscribe(notice => this.leave(notice));
  }

  private leave(notice: SessionClosedNotice): void {
    this.staffMenu.clear();
    this.studentMenu.clear();
    this.notifications.warning(notice.title ?? 'Sesión cerrada', notice.message ?? 'Se cerró tu sesión en otra pestaña.', 8000);
    this.router.navigate([notice.audience === 'student' ? PATHS.login.student : PATHS.login.staff]);
  }
}
