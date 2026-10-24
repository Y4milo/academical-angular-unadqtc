import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type DeliverableStatus = 'locked' | 'pending_letter' | 'pending_conformity' | 'finished';
export type DocumentKind = 'letter' | 'conformity';
export type DocumentFormat = 'docx' | 'pdf';

export interface ServiceOrderSummary {
  id: number;
  order_number: number;
  year: number;
  denomination: string;
  contractor_name: string;
  deliverables_count: number;
  finished_count: number;
}

/** Un entregable con lo que ya se emitió y lo que el sistema sugiere para el siguiente paso. */
export interface ServiceOrderDeliverable {
  id: number;
  position: number;
  status: DeliverableStatus;
  activity: string | null;
  due_date: string;
  working_date: string;
  non_working_reason: string | null;
  suggested_letter_date: string;
  suggested_observation: string;
  letter_number: number | null;
  letter_year: number | null;
  letter_date: string | null;
  report_number: number | null;
  report_year: number | null;
  report_date: string | null;
  conformity_date: string | null;
  record_number: string | null;
  record_year: number | null;
  penalty: string;
  delay_days: string;
  observation: string | null;
}

export interface ServiceOrder {
  id: number;
  ruc: string;
  contractor_name: string;
  contractor_document: string | null;
  order_number: number;
  year: number;
  notified_at: string;
  amount_per_deliverable: string;
  deliverables_count: number;
  denomination: string;
  deliverables: ServiceOrderDeliverable[];
}

export interface ServiceOrderCreate {
  ruc: string;
  contractor_name: string;
  order_number: number;
  notified_at: string;
  amount_per_deliverable: number;
  deliverables_count: number;
  denomination: string;
  deliverables: { due_date: string; activity: string | null }[];
}

export interface Taxpayer {
  ruc: string;
  business_name: string;
  status: string | null;
  condition: string | null;
  document_number: string | null;
}

export interface LetterBody {
  letter_date: string | null;
  letter_number: number | null;
  activity: string | null;
}

export interface ConformityBody {
  conformity_date: string | null;
  report_date: string | null;
  report_number: number | null;
  record_number: string;
  record_year: number | null;
  penalty: string | null;
  delay_days: string | null;
  observation: string | null;
}

export interface ServiceOrdersConfig {
  settings: Record<string, string>;
  year: number;
  next_letter_number: number;
  next_report_number: number;
}

export interface ConfigUpdate {
  settings?: Record<string, string>;
  sequences?: { kind: 'letter' | 'report'; year: number; last_number: number }[];
}

/** Fecha local como AAAA-MM-DD, sin pasar por UTC (que corre el día en la noche de Perú). */
export function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

@Injectable({ providedIn: 'root' })
export class ServiceOrdersService {
  private readonly apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiData<ServiceOrderSummary[]>> {
    return this.http.get<ApiData<ServiceOrderSummary[]>>(`${this.apiURL}/service-orders`);
  }

  show(id: number): Observable<ApiData<ServiceOrder>> {
    return this.http.get<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders/${id}`);
  }

  taxpayer(ruc: string): Observable<ApiData<Taxpayer>> {
    return this.http.get<ApiData<Taxpayer>>(`${this.apiURL}/service-orders/taxpayer/${ruc}`);
  }

  create(body: ServiceOrderCreate): Observable<ApiData<ServiceOrder>> {
    return this.http.post<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders`, body);
  }

  issueLetter(deliverableId: number, body: LetterBody): Observable<ApiData<ServiceOrder>> {
    return this.http.post<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/letter`, body);
  }

  issueConformity(deliverableId: number, body: ConformityBody): Observable<ApiData<ServiceOrder>> {
    return this.http.post<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/conformity`, body);
  }

  download(deliverableId: number, kind: DocumentKind, format: DocumentFormat): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiURL}/service-orders/deliverables/${deliverableId}/${kind}/${format}`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  config(): Observable<ApiData<ServiceOrdersConfig>> {
    return this.http.get<ApiData<ServiceOrdersConfig>>(`${this.apiURL}/service-orders/config`);
  }

  updateConfig(body: ConfigUpdate): Observable<ApiData<ServiceOrdersConfig>> {
    return this.http.patch<ApiData<ServiceOrdersConfig>>(`${this.apiURL}/service-orders/config`, body);
  }
}
