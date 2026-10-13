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

export interface ReportFilterOption {
  code: string;
  label: string;
  total: number;
}

/** Las opciones de los filtros de los reportes, con cuántas personas tiene cada una (vienen de Core). */
export interface ReportFilterOptions {
  profile_types: ReportFilterOption[];
  contracts: ReportFilterOption[];
  dependencies: ReportFilterOption[];
}

export type ManualAttendanceSource = 'barcode' | 'keyboard';

export interface ManualAttendanceRequest {
  dni: string;
  reason: string;
  campus_id: number;
  source: ManualAttendanceSource;
  confirm_duplicate?: boolean;
}

export type PunchKind = 'entry' | 'exit' | 'outside';

export interface PunchSlot {
  kind: PunchKind;
  status: string;
  label: string;
  scheduled: string | null;
}

export interface ManualAttendanceResult {
  attendance_id: number;
  time: string;
  punch_time: string;
  person: {
    dni: string;
    full_name: string;
    profile_type: 'teacher' | 'administrative';
    profile_type_label: string;
    position: string | null;
    dependency: string | null;
    dependency_acronym: string | null;
    contract_type: string | null;
  };
  slot: PunchSlot;
  verified_in_core: boolean;
  warnings: string[];
}

export interface ManualAttendanceRow {
  time: string;
  dni: string;
  full_name: string | null;
  profile_type: string | null;
  source: 'barcode' | 'keyboard';
  punch_kind: PunchKind | null;
  punch_status: string | null;
  reason: string | null;
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

  /** Asistencia manual por DNI (lector de barras o teclado): solo admin y RRHH, con motivo obligatorio. */
  registerByDni(body: ManualAttendanceRequest): Observable<ApiData<ManualAttendanceResult>> {
    return this.http.post<ApiData<ManualAttendanceResult>>(`${this.apiURL}/staff-attendance/register-by-dni`, body);
  }

  manualToday(campusId?: number): Observable<ApiData<ManualAttendanceRow[]>> {
    const query = campusId ? `?campus_id=${campusId}` : '';
    return this.http.get<ApiData<ManualAttendanceRow[]>>(`${this.apiURL}/staff-attendance/manual-today${query}`);
  }

  /** Tipo de personal, contrato o modalidad y oficina para los filtros de los reportes. */
  reportFilters(): Observable<ApiData<ReportFilterOptions>> {
    return this.http.get<ApiData<ReportFilterOptions>>(`${this.apiURL}/staff-attendance/report-filters`);
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
