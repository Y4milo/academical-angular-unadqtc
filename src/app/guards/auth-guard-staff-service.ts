import {Injectable} from '@angular/core';
import {
  CanActivate,
} from '@angular/router';
import {User} from '../models/login-user.model';
import {role} from '../core/constants/role';
import {paths} from '../core/constants/paths';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardStaff implements CanActivate {

  constructor() {}

  canActivate(): boolean {
    const loginUser = JSON.parse(sessionStorage.getItem('user')!) as User;

    if (loginUser) {
      switch (loginUser.role.value) {
        case role.rh:
        case role.professor:
        case role.administrative:
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
      window.location.href = `${location.origin}/${paths.login.staff}`;
      return false;
    }
  }
}
