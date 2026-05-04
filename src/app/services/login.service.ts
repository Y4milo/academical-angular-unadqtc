import { Injectable } from '@angular/core';
import {StaffUser} from '../models/staff-user.model';
import {PATHS} from '../core/constants/paths';
import {ROLE} from '../core/constants/role';
import {ApiData} from '../models/api/api-data.model';
import {StudentUser} from '../models/student-user.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  getResultLogin(
    user: StaffUser | null,
    allowedRoles: string[]
  ): {
    canActivate: boolean,
    link: string
  } {

    if (!user) {
      return {
        canActivate: false,
        link: `${location.origin}/${PATHS.login.staff}`
      };
    }

    if (allowedRoles.includes(user.role.value!)) {
      return { canActivate: true, link: '' };
    }

    // Redirección por rol
    const link = user.role.value === ROLE.student
      ? `${location.origin}/${PATHS.login.student}`
      : `${location.origin}/${PATHS.login.staff}`;

    return { canActivate: false, link };
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

  setStudent(apiData:  ApiData<StudentUser>): StudentUser {
    const user = apiData.payload.data as StudentUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  getStudent(): StudentUser {
    return JSON.parse(sessionStorage.getItem('user')!) as StudentUser;
  }

  isStudentLoggedIn(): boolean {
    const user = this.getStudent();

    if (!user) return false;

    return !!(
      user.role?.value
    );
  }
}
