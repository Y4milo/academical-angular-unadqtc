import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dictionary } from '../models/dictionary.model';
import {ApiData} from '../models/api/api-data.model';

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
  // getCampusList(): Observable<ApiDataEncoded<Dictionary[]>> {
  getCampusList(): Observable<ApiData<Dictionary[]>> {
    // return this.http.get<ApiDataEncoded<Dictionary[]>>(`${this.apiURL}/campus`);
    return this.http.get<ApiData<Dictionary[]>>(`${this.apiURL}/campus`);
  }

  /**
   * Obtiene la lista de tipos de documento desde la API
   * Endpoint: /id-type
   * @returns Observable con array de objetos tipo Dictionary
   */
  // getIdTypeList(): Observable<ApiDataEncoded<Dictionary[]>> {
  getIdTypeList(): Observable<ApiData<Dictionary[]>> {
    // return this.http.get<ApiDataEncoded<Dictionary[]>>(`${this.apiURL}/id-types`);
    return this.http.get<ApiData<Dictionary[]>>(`${this.apiURL}/id-types`);
  }

  /**
   * Obtiene la lista de géneros desde la API
   * Endpoint: /gender
   * @returns Observable con array de objetos tipo Dictionary
   */
  // getGenderList(): Observable<ApiData<Dictionary[]>> {
  getGenderList(): Observable<ApiData<Dictionary[]>> {
    return this.http.get<ApiData<Dictionary[]>>(`${this.apiURL}/gender`);
    return this.http.get<ApiData<Dictionary[]>>(`${this.apiURL}/gender`);
  }

  /**
   * Obtiene el semestre actual desde la API.
   * Endpoint: /current-semester
   * @returns Observable con un objeto tipo Dictionary
   */
  getCurrentSemester(): Observable<ApiData<Dictionary>> {
    return this.http.get<ApiData<Dictionary>>(`${this.apiURL}/semesters/current`);
  }
  /**
   * Obtiene el semestre actual desde la API.
   * Endpoint: /login-admin
   * @returns Observable con un objeto tipo Dictionary
   */
  logInAdmin(loginData: FormData): Observable<ApiData<string>> {
    return this.http.post<ApiData<string>>(`${this.apiURL}/login-admin`, loginData);
  }
  logOutAdmin(): Observable<ApiData<Dictionary>> {
    return this.http.get<ApiData<Dictionary>>(`${this.apiURL}/logout-admin`);
  }
  getStudentCardFlags() :Observable<ApiData<Dictionary[]>>{
    return this.http.get<ApiData<Dictionary[]>>(`${environment.apiUrl}/student-card-flags`);
  }
  getParticipantList() {
      return this.http.get<ApiData<Dictionary[]>>(`${environment.apiUrl}/get-participant-types`);
  }
  getEmploymentAgreement() :Observable<ApiData<Dictionary[]>> {
    return this.http.get<ApiData<Dictionary[]>>(`${this.apiURL}/employment-agreement`)
  }
}

