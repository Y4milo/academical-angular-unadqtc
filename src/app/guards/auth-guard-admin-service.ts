import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {ROLE} from '../core/constants/role';
import {LoginService} from '../services/login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardAdmin implements CanActivate {
  constructor(
    private loginService: LoginService,
  ) {}

  canActivate(): boolean {
    const loginUser = this.loginService.getUser();
    const loginResult = this.loginService.getResultLogin(loginUser, [ROLE.admin]);

    if (loginResult.canActivate)
      return true;

    window.location.href = loginResult.link;
    return false;
  }
}
