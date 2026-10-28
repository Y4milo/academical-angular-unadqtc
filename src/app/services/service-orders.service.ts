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
/** Quién firmó digitalmente un documento; `holder_matches` es null cuando no había un titular esperado. */
export interface DocumentSigner {
  name: string;
  certificate_kind: string;
  holder_matches: boolean | null;
  reason: string;
  signed_at: string;
}

/** Una firma anulada para corregir el documento: queda en el historial con su motivo. */
export interface DocumentVoid {
  id: number;
  signers: DocumentSigner[];
  reason: string;
  detail: string;
  voided_by: string | null;
  voided_at: string | null;
}

export type VoidReason = 'typing' | 'missing' | 'other';

export interface DocumentSignature {
  signed: boolean;
  signers: DocumentSigner[];
}

export interface SignatureStatus extends DocumentSignature {
  last_error: string | null;
}

export interface SigningConfig {
  configured: boolean;
  reasons: string[];
  script_url: string;
  port: number;
}

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
  letter_signed: boolean;
  letter_signature: DocumentSignature;
  conformity_signature: DocumentSignature;
  letter_history: DocumentVoid[];
  conformity_history: DocumentVoid[];
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
  include_signature: boolean;
}

export type LetterUpdate = { letter_date: string | null; letter_number: number; activity: string | null };

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
  has_signature: boolean;
  has_fingerprint: boolean;
  signing: SigningConfig;
}

export type SignatureKind = 'signature' | 'fingerprint';

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

/** La fecha que cae `days` días calendario después de `from` (a los 30 días de la notificación = fin del primer entregable). */
export function addDays(from: Date, days: number): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
}

/** Días calendario entre dos fechas locales. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000);
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

  signatureImage(kind: SignatureKind): Observable<Blob> {
    return this.http.get(`${this.apiURL}/service-orders/config/signature-images/${kind}`, { responseType: 'blob' });
  }

  uploadSignatureImage(kind: SignatureKind, file: File): Observable<ApiData<ServiceOrdersConfig>> {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<ApiData<ServiceOrdersConfig>>(`${this.apiURL}/service-orders/config/signature-images/${kind}`, body);
  }

  deleteSignatureImage(kind: SignatureKind): Observable<ApiData<ServiceOrdersConfig>> {
    return this.http.delete<ApiData<ServiceOrdersConfig>>(`${this.apiURL}/service-orders/config/signature-images/${kind}`);
  }

  prepareSignature(deliverableId: number, kind: DocumentKind, reason: string): Observable<ApiData<{ param: string; port: number }>> {
    return this.http.post<ApiData<{ param: string; port: number }>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/${kind}/signature/prepare`, { reason });
  }

  signatureStatus(deliverableId: number, kind: DocumentKind): Observable<ApiData<SignatureStatus>> {
    return this.http.get<ApiData<SignatureStatus>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/${kind}/signature`);
  }

  updateLetter(deliverableId: number, body: LetterUpdate): Observable<ApiData<ServiceOrder>> {
    return this.http.patch<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/letter`, body);
  }

  updateConformity(deliverableId: number, body: ConformityBody & { report_number: number }): Observable<ApiData<ServiceOrder>> {
    return this.http.patch<ApiData<ServiceOrder>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/conformity`, body);
  }

  voidSignature(deliverableId: number, kind: DocumentKind, body: { reason_type: VoidReason; detail: string }): Observable<ApiData<{ voided: boolean }>> {
    return this.http.post<ApiData<{ voided: boolean }>>(`${this.apiURL}/service-orders/deliverables/${deliverableId}/${kind}/signature/void`, body);
  }

  downloadVoid(deliverableId: number, kind: DocumentKind, voidId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiURL}/service-orders/deliverables/${deliverableId}/${kind}/voids/${voidId}`, { observe: 'response', responseType: 'blob' });
  }
}
