import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {PATHS} from '../core/constants/app-paths.constants';
import {safeReturnUrl} from '../core/utils/return-url.util';
import {LoginService} from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRoleGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    const user = this.loginService.getUser();
    const role = user?.role?.value;

    if (role && allowedRoles?.includes(role)) {
      return true;
    }

    // Sin sesión se guarda la página pedida para volver a ella al iniciar sesión.
    const returnUrl = user ? null : safeReturnUrl(state.url);

    return this.router.createUrlTree([PATHS.login.staff], returnUrl ? {queryParams: {returnUrl}} : {});
  }
}
