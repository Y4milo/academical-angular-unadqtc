import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  validatePayment(loginData: any): Observable<ApiData<string>> {
    return this.http.post<ApiData<string>>(`${this.apiURL}/payments/validate`, loginData);
  }
}
