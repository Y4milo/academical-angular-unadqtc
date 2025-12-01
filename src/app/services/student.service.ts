import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StudentBasicInfo} from '../models/student/student-basic-info.model';
import {ApiData} from '../models/api/api-data.model';
import {StudentRaking} from '../models/student/student-ranking.model';
import {Dictionary} from '../models/dictionary.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getStudentBasicInfoById(id: string): Observable<ApiData<StudentBasicInfo>> {
    return this.http.get<ApiData<StudentBasicInfo>>(`${environment.apiUrl}/students/id/${id}`);
  }

  getStudentBasicInfoByCode(code: string): Observable<ApiData<StudentBasicInfo>> {
    return this.http.get<ApiData<StudentBasicInfo>>(`${environment.apiUrl}/students/code/${code}`);
  }

  updateBasicInfo(id: string, studentData: StudentBasicInfo): Observable<ApiData<StudentBasicInfo>> {
    return this.http.put<ApiData<any>>(`${this.apiURL}/students/${id}/basic`, studentData);
  }

  getStudentRanking(studentData: { student: string; ranking: string }): Observable<ApiData<StudentRaking>> {
  // getStudentRanking(studentData: FormData): Observable<ApiData<StudentRaking>> {
    const headers = new HttpHeaders({
      'x-api-key': 'API_KEY_9f2b8c1e6d7a44c0b3f1e0ad78c9f2e1_!XK$72mPq9#LdA4'
    });
    return this.http.post<ApiData<StudentRaking>>(
      `https://bellasartescusco.edu.pe/ccomputo/administrador/api/students/studentRanking.php`,
      studentData,
      { headers });
  }

  getExcelStudentRanking(): Observable<ApiData<Dictionary>> {
    return this.http.get<ApiData<Dictionary>>(`${this.apiURL}/student-ranking-top`);
  }
}
