import { Injectable } from '@angular/core';
import {User} from '../models/login-user.model';
import {paths} from '../core/constants/paths';
import {role} from '../core/constants/role';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  getResultLogin(user: User, valueRole: string):
    {
      canActivate: boolean,
      link: string
    } {
    let  canActivate: boolean = false;
    let link: string = "";
    if (user) {
      if (user.role.value === valueRole) {
        canActivate = true;
      } else {
        switch (user.role.value) {
          case role.student:
            link = `${location.origin}/${paths.login.student}`;
          break;
          default:
            link = `${location.origin}/${paths.login.staff}`;
          break;
        }
      }
    } else {
      link = `${location.origin}/${paths.login.staff}`;
    }
    return {canActivate: canActivate, link: link};
  }
}
