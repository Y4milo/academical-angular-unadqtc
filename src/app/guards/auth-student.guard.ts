import {Injectable} from '@angular/core';
import {CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, map} from 'rxjs';
import {PATHS} from '../core/constants/app-paths.constants';
import {safeReturnUrl} from '../core/utils/return-url.util';
import {LoginService} from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthStudentGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {}

  /** Igual que el personal: una pestaña sin su copia del estudiante pregunta al API antes de mandar al ingreso. */
  canActivate(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> {
    if (this.loginService.isStudentLoggedIn()) {
      return true;
    }

    return this.loginService.restore('student').pipe(map(() => this.loginService.isStudentLoggedIn() || this.toLogin(state)));
  }

  private toLogin(state: RouterStateSnapshot): UrlTree {
    const returnUrl = safeReturnUrl(state.url);

    return this.router.createUrlTree([PATHS.login.student], returnUrl ? {queryParams: {returnUrl}} : {});
  }
}
