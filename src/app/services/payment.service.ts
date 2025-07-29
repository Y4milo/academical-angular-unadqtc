import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiResponse} from '../models/api-response.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  validatePayment(loginData: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiURL}/payments/validate`, loginData);
  }
}
