import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type DbuWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

/** Ajustes del módulo de citas de Bienestar Universitario; los valores y límites los define el backend. */
export interface DbuSettings {
  weekdays: DbuWeekday[];
  day_start: string;
  day_end: string;
  session_minutes: number;
  instant_booking: boolean;
  open_time: string;
  window_business_days: number;
  max_active_per_student: number;
  cancel_hours_before: number;
  waitlist_enabled: boolean;
  offer_minutes: number;
  urgent_enabled: boolean;
  confirm_attendance_enabled: boolean;
  reminder_hours_before: number;
  release_unconfirmed: boolean;
  release_hours_before: number;
  noshow_threshold: number;
  noshow_window_days: number;
  noshow_block_days: number;
}

export interface DbuAppointmentType {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface DbuAttendant {
  id: number;
  user_id: number;
  name: string;
  is_active: boolean;
  weekdays: DbuWeekday[];
  start_time: string;
  end_time: string;
  type_ids: number[];
}

export interface DbuCapacity {
  slots: string[];
  weekdays: DbuWeekday[];
  matrix: Record<string, Record<string, number>>;
  weekly_total: number;
}

export interface DbuCandidate {
  id: number;
  name: string;
}

export interface DbuConfig {
  settings: DbuSettings;
  defaults: DbuSettings;
  types: DbuAppointmentType[];
  attendants: DbuAttendant[];
  capacity: Record<string, DbuCapacity>;
  candidates: DbuCandidate[];
}

export interface DbuConfigLog {
  id: number;
  action: string;
  subject: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  user: string | null;
  created_at: string;
}

export interface DbuAttendantInput {
  user_id?: number;
  weekdays?: DbuWeekday[];
  start_time?: string;
  end_time?: string;
  type_ids?: number[];
  is_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DbuConfigService {
  private readonly apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  config(): Observable<ApiData<DbuConfig>> {
    return this.http.get<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config`);
  }

  updateSettings(body: Partial<DbuSettings>): Observable<ApiData<DbuConfig>> {
    return this.http.patch<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config/settings`, body);
  }

  addType(body: { code: string; name: string }): Observable<ApiData<DbuConfig>> {
    return this.http.post<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config/types`, body);
  }

  updateType(id: number, body: { name?: string; is_active?: boolean }): Observable<ApiData<DbuConfig>> {
    return this.http.patch<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config/types/${id}`, body);
  }

  addAttendant(body: DbuAttendantInput): Observable<ApiData<DbuConfig>> {
    return this.http.post<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config/attendants`, body);
  }

  updateAttendant(id: number, body: DbuAttendantInput): Observable<ApiData<DbuConfig>> {
    return this.http.patch<ApiData<DbuConfig>>(`${this.apiURL}/dbu/config/attendants/${id}`, body);
  }

  logs(limit = 50): Observable<ApiData<DbuConfigLog[]>> {
    return this.http.get<ApiData<DbuConfigLog[]>>(`${this.apiURL}/dbu/config/logs`, { params: { limit } });
  }
}
