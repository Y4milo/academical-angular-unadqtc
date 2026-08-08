import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, switchMap} from 'rxjs';
import {StudentBasicInfo} from '../models/student/student-basic-info.model';
import {ApiData} from '../models/api/api-data.model';
import {StudentRaking} from '../models/student/student-ranking.model';
import {Dictionary} from '../models/dictionary.model';
import {StudentUser} from '../models/student-user.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCsrfCookie() {
    return this.http.get('/sanctum/csrf-cookie', {
      withCredentials: true
    });
  }

  setPaymentSession(): Observable<ApiData<any>> {
    return this.http.get<ApiData<any>>(
      `${environment.apiUrl}/payment/set/student`,
    );
  }

  getStudentBasicInfo(): Observable<ApiData<StudentBasicInfo>> {
    return this.http.get<ApiData<StudentBasicInfo>>(
      `${environment.apiUrl}/students/get/basic-info`,
    );
  }

  updateBasicInfo(studentData: StudentBasicInfo): Observable<ApiData<StudentBasicInfo>> {
    return this.http.put<ApiData<any>>(
      `${this.apiURL}/students/update/basic-info`,
      studentData,
    );
  }

  getStudentRanking(studentData: { student: string; ranking: string }): Observable<ApiData<StudentRaking>> {
  // getStudentRanking(studentData: FormData): Observable<ApiData<StudentRaking>> {
    const headers = new HttpHeaders({
      'x-api-key': 'API_KEY_9f2b8c1e6d7a44c0b3f1e0ad78c9f2e1_!XK$72mPq9#LdA4'
    });
    return this.http.post<ApiData<StudentRaking>>(
      `https://bellasartescusco.edu.pe/ccomputo/administrador/api/students/studentRanking.php`,
      studentData,
      { headers, withCredentials: true });
  }

  getExcelStudentRanking(): Observable<ApiData<Dictionary>> {
    return this.http.get<ApiData<Dictionary>>(`${this.apiURL}/student-ranking-top`);
  }



  logIn(loginData: FormData): Observable<ApiData<StudentUser>> {

    return this.http.get('/sanctum/csrf-cookie', {
      withCredentials: true
    }).pipe(

      switchMap(() =>
        this.http.post<ApiData<StudentUser>>(
          `${this.apiURL}/users/v1/student/login`,
          loginData
        )
      )

    );
  }
}
