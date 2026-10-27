import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface CardSettings {
  enabled: boolean;
  upload_start: string | null;
  upload_end: string | null;
  max_attempts: number;
  dni_required: boolean;
  photo_required: boolean;
  require_payment: boolean;
  photo_min_kb: number;
  photo_max_kb: number;
  photo_width: number;
  photo_height: number;
}

export interface CardModulePayload {
  semester: { id: number; name: string; state: string };
  settings: CardSettings;
  configured: boolean;
  locked: boolean;
  editable: boolean;
}

export interface CardPayment {
  payment_id: number;
  number: string | null;
  code: string | null;
  payment_status: string;
  payment_label: string;
  student: string | null;
  card_status: string;
  card_label: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface CardPaymentsPage {
  payments: CardPayment[];
  total: number;
  page: number;
  per_page: number;
  options: { payment: FilterOption[]; card: FilterOption[] };
}

export interface CardPaymentFilters {
  status?: string | null;
  card_status?: string | null;
  search?: string;
}

/** Módulo de carné universitario para administrador y académico: configuración por semestre y pagos del semestre. */
@Injectable({ providedIn: 'root' })
export class StudentCardModuleService {
  private readonly apiURL = `${environment.apiUrl}/academic/student-card/semesters`;

  constructor(private http: HttpClient) {}

  show(semesterId: number): Observable<ApiData<CardModulePayload>> {
    return this.http.get<ApiData<CardModulePayload>>(`${this.apiURL}/${semesterId}`);
  }

  save(semesterId: number, settings: CardSettings, note: string | null): Observable<ApiData<CardModulePayload>> {
    return this.http.put<ApiData<CardModulePayload>>(`${this.apiURL}/${semesterId}`, { settings, note });
  }

  copyFromPrevious(semesterId: number): Observable<ApiData<CardModulePayload>> {
    return this.http.post<ApiData<CardModulePayload>>(`${this.apiURL}/${semesterId}/copy`, {});
  }

  payments(semesterId: number, filters: CardPaymentFilters, page: number, perPage: number): Observable<ApiData<CardPaymentsPage>> {
    return this.http.get<ApiData<CardPaymentsPage>>(`${this.apiURL}/${semesterId}/payments`, { params: this.params(filters).set('page', page).set('per_page', perPage) });
  }

  exportPayments(semesterId: number, filters: CardPaymentFilters): Observable<Blob> {
    return this.http.get(`${this.apiURL}/${semesterId}/payments/export`, { params: this.params(filters), responseType: 'blob' });
  }

  private params(filters: CardPaymentFilters): HttpParams {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.card_status) {
      params = params.set('card_status', filters.card_status);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    return params;
  }
}
