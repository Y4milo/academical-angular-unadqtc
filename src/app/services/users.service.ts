import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {LoginPerson} from '../models/login-person.model';
import {LoginUser} from '../models/login-user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiURL = environment.apiUrl;
  constructor(private http: HttpClient) { }

  logIn(loginData: FormData): Observable<ApiData<LoginUser>> {
    return this.http.post<ApiData<LoginUser>>(`${this.apiURL}/login-test`, loginData);
  }
}
