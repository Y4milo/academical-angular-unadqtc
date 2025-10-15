import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {EventAttendance} from '../models/event-attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  storeAttendancePerson(formData: FormData): Observable<ApiData<EventAttendance>> {
    return this.http.post<ApiData<EventAttendance>>(`${this.apiURL}/event/attendance-check-in`, formData);
  }
}
