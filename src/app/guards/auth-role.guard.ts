import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, UrlTree} from '@angular/router';
import {PATHS} from '../core/constants/app-paths.constants';
import {LoginService} from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthRoleGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    const user = this.loginService.getUser();
    const role = user?.role?.value;

    if (role && allowedRoles?.includes(role)) {
      return true;
    }

    return this.router.parseUrl(PATHS.login.staff);
  }
}
