import {Injectable} from '@angular/core';
import {CanActivate, Router, UrlTree} from '@angular/router';
import {PATHS} from '../core/constants/app-paths.constants';
import {LoginService} from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthStudentGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    return this.loginService.isStudentLoggedIn()
      ? true
      : this.router.parseUrl(PATHS.login.student);
  }
}
