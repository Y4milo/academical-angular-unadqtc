import { Injectable } from '@angular/core';
import {StaffUser} from '../models/staff-user.model';
import {ApiData} from '../models/api/api-data.model';
import {StudentUser} from '../models/student-user.model';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor() { }

  setUser(apiData:  ApiData<StaffUser>): StaffUser {
    const user = apiData.payload.data as StaffUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  getUser(): StaffUser | null {
    return this.getSessionUser<StaffUser>();
  }

  removeUser(): void {
    sessionStorage.removeItem('user');
  }

  setStudent(apiData:  ApiData<StudentUser>): StudentUser {
    const user = apiData.payload.data as StudentUser;
    sessionStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  getStudent(): StudentUser | null {
    return this.getSessionUser<StudentUser>();
  }

  isStudentLoggedIn(): boolean {
    const user = this.getStudent();

    if (!user) return false;

    return !!(
      user.role?.value
    );
  }

  private getSessionUser<T>(): T | null {
    const rawUser = sessionStorage.getItem('user');

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as T;
    } catch {
      this.removeUser();
      return null;
    }
  }
}
