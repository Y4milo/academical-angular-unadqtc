import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StudentBasicInfo} from '../models/student-basic-info.model';
import {ApiResponse} from '../models/api-response.model';
import {Dictionary} from '../models/dictionary.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getStudentBasicInfoById(id: string): Observable<ApiResponse<StudentBasicInfo>> {
    return this.http.get<ApiResponse<StudentBasicInfo>>(`${environment.apiUrl}/students/id/${id}`);
  }

  getStudentBasicInfoByCode(code: string): Observable<ApiResponse<StudentBasicInfo>> {
    return this.http.get<ApiResponse<StudentBasicInfo>>(`${environment.apiUrl}/students/code/${code}`);
  }

  updateBasicInfo(id: string, studentData: StudentBasicInfo): Observable<ApiResponse<StudentBasicInfo|Dictionary>> {
    return this.http.put<ApiResponse<any>>(`${this.apiURL}/students/${id}/basic`, studentData);
  }
}
