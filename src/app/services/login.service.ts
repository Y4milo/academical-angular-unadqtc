import { Injectable } from '@angular/core';
import {StaffUser} from '../models/staff-user.model';
import {PATHS} from '../core/constants/paths';
import {ROLE} from '../core/constants/role';
import {ApiData} from '../models/api/api-data.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  getResultLogin(
    user: StaffUser,
    allowedRoles: string[] // <--- ahora es un array
  ): {
    canActivate: boolean,
    link: string
  } {

    let canActivate = false;
    let link = "";

    if (user) {
      // ✔ Si el usuario tiene un rol incluido en allowedRoles
      if (allowedRoles.includes(user.role.value!)) {
        canActivate = true;
      } else {
        // ❌ No tiene permiso → redirección según su rol
        switch (user.role.value) {
          case ROLE.student:
            link = `${location.origin}/${PATHS.login.student}`;
            break;

          default:
            link = `${location.origin}/${PATHS.login.staff}`;
            break;
        }
      }
    } else {
      // Usuario no logueado
      link = `${location.origin}/${PATHS.login.staff}`;
    }

    return { canActivate, link };
  }


  setUser(apiData:  ApiData<StaffUser>): StaffUser {
    const user = apiData.payload.data as StaffUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  getUser(): StaffUser {
    return JSON.parse(sessionStorage.getItem('user')!) as StaffUser;
  }

  removeUser(): void {
    sessionStorage.removeItem('user');
  }
}
