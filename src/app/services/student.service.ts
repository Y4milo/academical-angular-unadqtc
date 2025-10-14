import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {StudentBasicInfo} from '../models/student-basic-info.model';
import {ApiData} from '../models/api/api-data.model';
import {Dictionary} from '../models/dictionary.model';
import {ApiDataEncoded} from '../models/api/api-data-encoded.model';

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
}
