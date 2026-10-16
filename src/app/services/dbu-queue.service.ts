import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface DbuQueueActions {
  attended: boolean;
  no_show: boolean;
  cancel: boolean;
  confirm: boolean;
  reject: boolean;
  reassign: boolean;
  reopen: boolean;
}

export interface DbuQueueEvent {
  id: number;
  actor_type: 'student' | 'user' | 'system';
  actor_ref: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface DbuQueueItem {
  id: number;
  code: string;
  status: string;
  date: string;
  time: string;
  type_id: number;
  type: string;
  attendant_id: number | null;
  attendant: string | null;
  full_name: string;
  document_number: string;
  student_code: string | null;
  contact_email: string;
  contact_phone: string | null;
  reason: string | null;
  note: string | null;
  is_urgent: boolean;
  attendance_confirmed: boolean;
  cancel_reason: string | null;
  actions: DbuQueueActions;
  events?: DbuQueueEvent[];
}

export interface DbuQueueSummary {
  total?: number;
  reserved?: number;
  pending?: number;
  attended?: number;
  no_show?: number;
  cancelled?: number;
  urgent?: number;
}

export interface DbuQueueNamed {
  id: number;
  name: string;
}

export interface DbuQueueResult {
  date: string;
  summary: DbuQueueSummary;
  items: DbuQueueItem[];
  scope: 'all' | 'own';
  types?: DbuQueueNamed[];
  attendants?: DbuQueueNamed[];
}

export interface DbuQueueFilters {
  date?: string;
  status?: string | null;
  type_id?: number | null;
  attendant_id?: number | null;
  search?: string | null;
}

export type DbuQueueAction = 'attended' | 'no-show' | 'cancel' | 'confirm' | 'reject' | 'reopen' | 'reassign' | 'note';

@Injectable({ providedIn: 'root' })
export class DbuQueueService {
  private readonly base = `${environment.apiUrl}/dbu/queue`;

  constructor(private http: HttpClient) {}

  list(filters: DbuQueueFilters): Observable<ApiData<DbuQueueResult>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<ApiData<DbuQueueResult>>(this.base, { params });
  }

  show(id: number): Observable<ApiData<DbuQueueItem>> {
    return this.http.get<ApiData<DbuQueueItem>>(`${this.base}/${id}`);
  }

  act(id: number, action: DbuQueueAction, body: { note?: string | null; reason?: string | null; attendant_id?: number | null } = {}): Observable<ApiData<DbuQueueItem>> {
    return this.http.post<ApiData<DbuQueueItem>>(`${this.base}/${id}/${action}`, body);
  }
}
