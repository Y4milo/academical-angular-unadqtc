import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {StaffUser} from '../models/staff-user.model';
import {StaffLogoutDestination} from '../models/staff-logout.model';
import {MenuItem} from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiURL = environment.apiUrl;
  constructor(private http: HttpClient) { }

  logIn(loginData: FormData): Observable<ApiData<StaffUser>> {
    return this.http.post<ApiData<StaffUser>>(`${this.apiURL}/users/v1/staff/login`, loginData);
  }

  getStaffMenu(): Observable<ApiData<MenuItem[]>> {
    return this.http.get<ApiData<MenuItem[]>>(`${this.apiURL}/users/v1/staff/menu`);
  }

  changeStaffPassword(passwordData: FormData): Observable<ApiData<null>> {
    return this.http.post<ApiData<null>>(`${this.apiURL}/users/v1/staff/change-password`, passwordData);
  }

  /** Con `everywhere` («Cerrar también en Core») el API manda al navegador a Core para que cierre también su sesión. */
  logoutStaff(everywhere = false): Observable<ApiData<StaffLogoutDestination>> {
    return this.http.post<ApiData<StaffLogoutDestination>>(`${this.apiURL}/users/v1/staff/logout`, everywhere ? {everywhere: true} : {});
  }
}
