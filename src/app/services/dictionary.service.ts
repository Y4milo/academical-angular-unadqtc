import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dictionary } from '../models/dictionary.model';
import {ApiResponse} from '../models/api-response.model';
import {StudentCard} from '../models/student-card.model';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {

  // URL base de la API definida en environments.ts
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de campus desde la API
   * Endpoint: /campus
   * @returns Observable con array de objetos tipo Dictionary
   */
  getCampusList(): Observable<ApiResponse<Dictionary[]>> {
    return this.http.get<ApiResponse<Dictionary[]>>(`${this.apiURL}/campus`);
  }

  /**
   * Obtiene la lista de tipos de documento desde la API
   * Endpoint: /id-type
   * @returns Observable con array de objetos tipo Dictionary
   */
  getIdTypeList(): Observable<ApiResponse<Dictionary[]>> {
    return this.http.get<ApiResponse<Dictionary[]>>(`${this.apiURL}/id-types`);
  }

  /**
   * Obtiene la lista de géneros desde la API
   * Endpoint: /gender
   * @returns Observable con array de objetos tipo Dictionary
   */
  getGenderList(): Observable<ApiResponse<Dictionary[]>> {
    return this.http.get<ApiResponse<Dictionary[]>>(`${this.apiURL}/gender`);
  }

  /**
   * Obtiene el semestre actual desde la API.
   * Endpoint: /current-semester
   * @returns Observable con un objeto tipo Dictionary
   */
  getCurrentSemester(): Observable<ApiResponse<Dictionary>> {
    return this.http.get<ApiResponse<Dictionary>>(`${this.apiURL}/semesters/current`);
  }
  /**
   * Obtiene el semestre actual desde la API.
   * Endpoint: /login-admin
   * @returns Observable con un objeto tipo Dictionary
   */
  logInAdmin(loginData: FormData): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiURL}/login-admin`, loginData);
  }
  logOutAdmin(): Observable<ApiResponse<Dictionary>> {
    return this.http.get<ApiResponse<Dictionary>>(`${this.apiURL}/logout-admin`);
  }
  getStudentCardFlags() :Observable<ApiResponse<string>>{
    return this.http.get<ApiResponse<string>>(`${environment.apiUrl}/student-card-flags`);
  }
}

