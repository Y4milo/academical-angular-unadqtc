import {Injectable} from '@angular/core';
import {
  CanActivate,
} from '@angular/router';
import {User} from '../models/login-user.model';
import {role} from '../core/constants/role';
import {LoginService} from '../services/login.service';
import {paths} from '../core/constants/paths';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardAcademic implements CanActivate {

  constructor(
    private loginService: LoginService,
  ) {}

  canActivate(): boolean {
    const loginUser = JSON.parse(sessionStorage.getItem('login_id')!) as User;
    const loginResult =  this.loginService.getResultLogin(loginUser, role.academic)
    if (loginResult.canActivate)
      return true;
    else {
      window.location.href = loginResult.link;
      return false;
    }
  }
}
