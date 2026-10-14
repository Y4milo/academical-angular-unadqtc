import {Injectable} from '@angular/core';
import {CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
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

  canActivate(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.loginService.isStudentLoggedIn()) {
      return true;
    }

    const returnUrl = safeReturnUrl(state.url);

    return this.router.createUrlTree([PATHS.login.student], returnUrl ? {queryParams: {returnUrl}} : {});
  }
}
