import {TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot} from '@angular/router';

import {AuthRoleGuard} from './auth-role.guard';
import {LoginService} from '../services/login.service';

describe('AuthRoleGuard', () => {
  let guard: AuthRoleGuard;
  let user: unknown = null;

  const route = (data: Record<string, unknown>) => ({data}) as unknown as ActivatedRouteSnapshot;
  const state = {url: '/hr'} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), {provide: LoginService, useValue: {getUser: () => user}}],
    });
    guard = TestBed.inject(AuthRoleGuard);
  });

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

  it('sends a person without session to the login', () => {
    user = null;
    const result = guard.canActivate(route({roles: ['hr']}), state);
    expect(result instanceof Object && TestBed.inject(Router).serializeUrl(result as never)).toContain('/');
  });
});
