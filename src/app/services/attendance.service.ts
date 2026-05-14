import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {EventAttendance} from '../models/event-attendance.model';
import {Attendance} from '../models/attendance.model';
import {Dictionary} from '../models/dictionary.model';

export interface StaffAttendancePerson {
  number: string;
  full_name: string;
  position?: string | null;
  dependency?: string | null;
  contract_type?: string | null;
  role?: string | null;
}

export interface StaffAttendanceByNumberResponse {
  staff: StaffAttendancePerson | null;
  attendances: Attendance[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  storeAttendance(formData: FormData): Observable<ApiData<EventAttendance>> {
    return this.http.post<ApiData<EventAttendance>>(`${this.apiURL}/event/attendance/store`, formData);
  }
  listAttendancesByNumber(formData: FormData): Observable<ApiData<StaffAttendanceByNumberResponse>> {
    return this.http.post<ApiData<StaffAttendanceByNumberResponse>>(`${this.apiURL}/staff-attendance/list-by-number`, formData);
  }

  myAttendances(formData: FormData): Observable<ApiData<Attendance[]>> {
    return this.http.post<ApiData<Attendance[]>>(`${this.apiURL}/staff-attendance/my-attendances`, formData);
  }

  downloadAttendancesExcel(formData: FormData): Observable<Blob> {
    return this.http.post(`${this.apiURL}/staff-attendance/export-by-contract-type`, formData, {
      responseType: 'blob'
    });
  }

  downloadAttendancesByNumberExcel(formData: FormData): Observable<Blob> {
    return this.http.post(`${this.apiURL}/staff-attendance/export-by-number`, formData, {
      responseType: 'blob'
    });
  }

  downloadConsolidatedExcel(formData: FormData): Observable<Blob> {
    return this.http.post(`${this.apiURL}/staff-attendance/export-consolidated-attendance`, formData, {
      responseType: 'blob'
    });
  }

}
