import {Injectable} from '@angular/core';
import {
  CanActivate,
} from '@angular/router';
import {StaffUser} from '../models/staff-user.model';
import {ROLE} from '../core/constants/role';
import {PATHS} from '../core/constants/paths';
import {LoginService} from '../services/login.service';


@Injectable({
  providedIn: 'root',
})

export class AuthGuardStaff implements CanActivate {

  constructor(
    private loginService: LoginService,
  ) {}

  canActivate(): boolean {
    const loginUser = this.loginService.getUser();
    // console.log('User:');
    // console.log(loginUser);
    // console.log('Role:' + ROLE.academic);
    const allowedRoles = [ROLE.professor, ROLE.administrative];
    const login_result =  this.loginService.getResultLogin(loginUser, allowedRoles)
    // console.log(login_result);
    if (login_result.canActivate)
      return true;
    else {
      // window.location.href = login_result.link;
      return false;
    }
    // return true;
  }
}
