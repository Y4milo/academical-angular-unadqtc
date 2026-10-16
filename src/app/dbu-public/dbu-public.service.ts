import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface DbuPublicType {
  id: number;
  code: string;
  name: string;
}

export interface DbuPublicConfig {
  types: DbuPublicType[];
  weekdays: string[];
  day_start: string;
  day_end: string;
  session_minutes: number;
  window_business_days: number;
  open_time: string;
  max_active_per_student: number;
  cancel_hours_before: number;
  instant_booking: boolean;
  test_mode: boolean;
  turnstile: { enabled: boolean; site_key: string | null };
}

export interface DbuPublicSlot {
  time: string;
  capacity: number;
  booked: number;
  free: number;
  available: boolean;
}

export interface DbuPublicDay {
  date: string;
  weekday: string;
  free_total: number;
  slots: DbuPublicSlot[];
}

export interface DbuPublicAvailability {
  type: DbuPublicType;
  days: DbuPublicDay[];
}

export interface DbuPublicAppointment {
  code: string;
  status: string;
  type: string;
  date: string;
  time: string;
  can_cancel: boolean;
}

export interface DbuIdentityResult {
  session: string;
  name: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class DbuPublicService {
  private readonly base = `${environment.apiUrl}/public/dbu`;

  constructor(private http: HttpClient) {}

  configuration(): Observable<ApiData<DbuPublicConfig>> {
    return this.http.get<ApiData<DbuPublicConfig>>(`${this.base}/configuration`);
  }

  identity(body: { document_type: string; document_number: string; turnstile_token?: string | null }): Observable<ApiData<DbuIdentityResult>> {
    return this.http.post<ApiData<DbuIdentityResult>>(`${this.base}/identity`, body);
  }

  sendCode(body: { session: string; email: string; phone?: string | null; turnstile_token?: string | null }): Observable<ApiData<{ sent_to: string }>> {
    return this.http.post<ApiData<{ sent_to: string }>>(`${this.base}/contact-email/code`, body);
  }

  verifyCode(body: { session: string; code: string }): Observable<ApiData<{ verified: boolean }>> {
    return this.http.post<ApiData<{ verified: boolean }>>(`${this.base}/contact-email/verify`, body);
  }

  availability(body: { session: string; type_id: number }): Observable<ApiData<DbuPublicAvailability>> {
    return this.http.post<ApiData<DbuPublicAvailability>>(`${this.base}/availability`, body);
  }

  reserve(body: { session: string; type_id: number; date: string; time: string; reason?: string | null }): Observable<ApiData<DbuPublicAppointment>> {
    return this.http.post<ApiData<DbuPublicAppointment>>(`${this.base}/appointments`, body);
  }

  status(body: { code: string; document_number: string }): Observable<ApiData<DbuPublicAppointment>> {
    return this.http.post<ApiData<DbuPublicAppointment>>(`${this.base}/appointments/status`, body);
  }

  cancel(body: { code: string; document_number: string }): Observable<ApiData<DbuPublicAppointment>> {
    return this.http.post<ApiData<DbuPublicAppointment>>(`${this.base}/appointments/cancel`, body);
  }
}

/** Mensaje legible de un error del API público de citas. */
export function dbuErrorMessage(error: unknown, fallback = 'No se pudo completar la operación. Inténtalo nuevamente.'): string {
  const body = (error as { error?: { payload?: { message?: string } } })?.error;
  return body?.payload?.message ?? fallback;
}

export const DBU_STATUS_LABELS: Record<string, string> = {
  reserved: 'Reservada',
  pending: 'Pendiente de aprobación',
  attended: 'Atendida',
  no_show: 'No asististe',
  cancelled: 'Cancelada',
  released: 'Cupo liberado',
};
