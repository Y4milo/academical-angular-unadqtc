import {HttpClient} from '@angular/common/http';
import {Injectable, NgZone, OnDestroy, inject} from '@angular/core';
import {Observable, Subject, catchError, map, of} from 'rxjs';
import {StaffUser} from '../models/staff-user.model';
import {ApiData} from '../models/api/api-data.model';
import {StudentUser} from '../models/student-user.model';
import {STATUS} from '../core/constants/api-status.constants';
import {ROLE} from '../core/constants/app-roles.constants';
import {environment} from '../../environments/environment';

/** Which login a screen needs: the staff one or the student one. */
export type SessionAudience = 'staff' | 'student';

/** A tab of this browser closed the session (the person signed out, or the API said it ended): every other tab must leave too. */
export interface SessionClosedNotice {
  audience: SessionAudience;
  title?: string;
  message?: string;
}

/** The channel the tabs of one browser use to tell each other that the session ended. */
export const SESSION_CHANNEL = 'academical-session';

/**
 * The person signed in to this tab. The API decides who is signed in (the session cookie, shared by every tab of the browser); this service only
 * keeps a copy for the tab, so a new tab asks the API (`restore`) instead of sending the person to the login again. The session ends by
 * inactivity, by its maximum length or when the person closes it, and then every tab of the browser leaves at once (`signOut`).
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(SESSION_CHANNEL);

  /** Another tab closed the session: this one already forgot its user, and whoever listens takes the person to the login. */
  readonly closedElsewhere = new Subject<SessionClosedNotice>();

  constructor() {
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent<SessionClosedNotice & {type?: string}>) => {
        if (event.data?.type !== 'closed') return;
        // A tab that was not signed in (the login, a public page) has nothing to leave.
        const signedIn = sessionStorage.getItem('user') !== null;
        this.removeUser();
        if (signedIn) {
          this.zone.run(() => this.closedElsewhere.next({audience: event.data.audience, title: event.data.title, message: event.data.message}));
        }
      };
    }
  }

  ngOnDestroy(): void {
    this.channel?.close();
  }

  /** `via` dice cómo se abrió la sesión: solo una sesión `core` ofrece «Cerrar también en Core» (el API es quien decide el destino de verdad). */
  setUser(apiData:  ApiData<StaffUser>, via: 'core' | 'local' = 'local'): StaffUser {
    const user = apiData.payload.data as StaffUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('auth_via', via);
    return user;
  }

  /** ¿La sesión se abrió con la cuenta de Core? */
  openedWithCore(): boolean {
    return sessionStorage.getItem('auth_via') === 'core';
  }

  getUser(): StaffUser | null {
    return this.getSessionUser<StaffUser>();
  }

  /** Forgets the user of this tab only. To end the session in every tab, use `signOut`. */
  removeUser(): void {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_via');
  }

  /**
   * The session ended (the person signed out, or the API answered that it is closed): this tab forgets its user and the other tabs of the
   * browser are told, so they leave too. `title` and `message` explain why, when the API said it.
   */
  signOut(notice: Partial<SessionClosedNotice> = {}): void {
    const audience = notice.audience ?? (this.getUser()?.role?.value === ROLE.student ? 'student' : 'staff');
    this.removeUser();
    this.channel?.postMessage({type: 'closed', audience, title: notice.title, message: notice.message});
  }

  /**
   * Asks the API whether this browser already has an open session (a new tab, a reload, a link opened from an email). With a session, the tab
   * keeps the same copy the login keeps and answers true; without one, false. It never fails: an error counts as no session.
   */
  restore(audience: SessionAudience): Observable<boolean> {
    return this.http.get<ApiData<StaffUser & {auth_via?: string}>>(`${environment.apiUrl}/users/v1/session`, {params: {audience}}).pipe(
      map(response => {
        if (response?.status !== STATUS.success || !response.payload?.data) return false;
        if (audience === 'student') {
          this.setStudent(response as unknown as ApiData<StudentUser>);
        } else {
          this.setUser(response, response.payload.data.auth_via === 'core' ? 'core' : 'local');
        }

        return true;
      }),
      catchError(() => of(false)),
    );
  }

  setStudent(apiData:  ApiData<StudentUser>): StudentUser {
    const user = apiData.payload.data as StudentUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  getStudent(): StudentUser | null {
    return this.getSessionUser<StudentUser>();
  }

  isStudentLoggedIn(): boolean {
    const user = this.getStudent();

    if (!user) return false;

    return !!(
      user.role?.value
    );
  }

  private getSessionUser<T>(): T | null {
    const rawUser = sessionStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as T;
    } catch {
      this.removeUser();
      return null;
    }
  }
}
