import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, firstValueFrom, of} from 'rxjs';

import {AuthRoleGuard} from './auth-role.guard';
import {LoginService} from '../services/login.service';

describe('AuthRoleGuard', () => {
  let guard: AuthRoleGuard;
  let user: unknown = null;
  /** What the API knows: the user the browser's session has, or null. */
  let apiUser: unknown = null;
  let restore: jasmine.Spy;

  const route = (data: Record<string, unknown>) => ({data}) as unknown as ActivatedRouteSnapshot;
  const state = {url: '/hr'} as RouterStateSnapshot;

  beforeEach(() => {
    user = null;
    apiUser = null;
    restore = jasmine.createSpy('restore').and.callFake(() => {
      user = apiUser;
      return of(apiUser !== null);
    });
    TestBed.configureTestingModule({
      providers: [provideRouter([]), {provide: LoginService, useValue: {getUser: () => user, restore}}],
    });
    guard = TestBed.inject(AuthRoleGuard);
  });

  const resolve = async (result: boolean | UrlTree | Observable<boolean | UrlTree>) => (result instanceof Observable ? firstValueFrom(result) : result);

  it('lets the role in when the route and the session ask for no permissions', () => {
    user = {role: {value: 'hr'}};
    expect(guard.canActivate(route({roles: ['hr']}), state)).toBeTrue();
  });

  it('decides by permission when the route asks for permissions and the session has them', () => {
    user = {role: {value: 'professor'}, permissions: ['attendance.manage']};
    expect(guard.canActivate(route({roles: ['hr'], permissions: ['attendance.manage']}), state)).toBeTrue();

    user = {role: {value: 'hr'}, permissions: ['attendance.view']};
    expect(guard.canActivate(route({roles: ['hr'], permissions: ['attendance.manage']}), state)).not.toBeTrue();
  });

  it('falls back to the role for a session that has no permissions yet', () => {
    user = {role: {value: 'hr'}};
    expect(guard.canActivate(route({roles: ['hr'], permissions: ['attendance.manage']}), state)).toBeTrue();
  });

  it('does not ask the API again when the tab already has the user', () => {
    user = {role: {value: 'hr'}};
    guard.canActivate(route({roles: ['hr']}), state);
    expect(restore).not.toHaveBeenCalled();
  });

  it('lets a new tab in with the session the browser already has', async () => {
    apiUser = {role: {value: 'hr'}};

    expect(await resolve(guard.canActivate(route({roles: ['hr']}), state))).toBeTrue();
    expect(restore).toHaveBeenCalledOnceWith('staff');
  });

  it('sends a person without session to the login, keeping the page asked for', async () => {
    const result = await resolve(guard.canActivate(route({roles: ['hr']}), state));

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('returnUrl=%2Fhr');
  });
});
