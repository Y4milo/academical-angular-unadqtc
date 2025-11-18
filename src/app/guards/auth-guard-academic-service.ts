import {Injectable} from '@angular/core';
import {
  CanActivate,
  Router,
} from '@angular/router';
import {JwtService} from '../services/jwt.service';
import {User} from '../models/login-user.model';
import {log} from '@angular-devkit/build-angular/src/builders/ssr-dev-server';
import {role} from '../core/constants/role';
import {paths} from '../core/constants/paths';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardAcademic implements CanActivate {

  constructor() {}

  canActivate(): boolean {
    const loginUser = JSON.parse(sessionStorage.getItem('login_id')!) as User;

    if (loginUser) {
      switch (loginUser.role.value) {
        case role.academic:
          return true;
        case role.student:
          window.location.href = `${location.origin}/${paths.login.student}`;
          return false;
        default:
          window.location.href = `${location.origin}/${paths.login.staff}`;
          return false;
      }
    }
    else {
      // No hay token
      window.location.href = `${location.origin}/${paths.login.staff}`;
      return false;
    }
  }
}
