import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {StaffUser} from '../models/staff-user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiURL = environment.apiUrl;
  constructor(private http: HttpClient) { }

  logIn(loginData: FormData): Observable<ApiData<StaffUser>> {
    return this.http.post<ApiData<StaffUser>>(`${this.apiURL}/users/v1/login`, loginData);
  }
}
