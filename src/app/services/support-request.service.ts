import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export type RequesterType = 'student' | 'professor' | 'administrative' | 'unknown' | 'former_member';
export type SupportRequestType = 'recover_email' | 'reset_password' | 'create_email' | 'reactivate_email' | 'mfa_problem' | 'other';

export interface SupportRequestSubmission {
  requester_type: RequesterType;
  request_type: SupportRequestType;
  document_number: string;
  student_code?: string;
  contact_channel: 'email' | 'phone';
  contact_value: string;
  new_personal_email?: string;
  description?: string;
}

export interface PublicSupportRequest {
  ticket_number: string;
  request_type: SupportRequestType;
  status: string;
  validation_level: string;
  requires_verification: boolean;
  requires_manual_review: boolean;
  institutional_email?: string | null;
  created_at: string;
  was_duplicate?: boolean;
}

export interface AdminSupportRequest extends PublicSupportRequest {
  id: number;
  requester_type_declared: RequesterType;
  requester_type_detected: RequesterType | null;
  document_last_four: string;
  manual_review_reason: string | null;
  validation_snapshot: Record<string, boolean>;
  description: string | null;
  student?: Record<string, unknown> | null;
  staff?: Record<string, unknown> | null;
  validations?: Array<{validation_type: string; status: string; source: string}>;
  actions?: Array<{action: string; previous_status: string; new_status: string; notes: string; created_at: string}>;
  contact_comparison?: {
    channel: 'email' | 'phone';
    submitted: string | null;
    registered: string | null;
    matches: boolean;
  };
  requested_personal_email?: string | null;
  proposed_personal_email?: string | null;
  personal_email_verified?: boolean;
  contact_verified_at?: string | null;
  requester_summary?: {full_name: string; code: string | null; document: string; phone: string | null; institutional_email: string | null};
}

interface ApiResponse<T> { status: string; payload: {message: string; data: T; mail_delivery?: {test_mode: boolean; test_recipient: string | null}}; }
export interface AvailableChannel { value: 'email' | 'phone'; label: string; masked: string; }
export interface AvailableChannels { identity_found: boolean; channels: AvailableChannel[]; }
interface Page<T> { data: T[]; current_page: number; total: number; per_page: number; }

@Injectable({providedIn: 'root'})
export class SupportRequestService {
  private readonly publicUrl = `${environment.apiUrl}/public/support-requests`;
  private readonly adminUrl = `${environment.apiUrl}/support-requests`;
  constructor(private http: HttpClient) {}

  configuration(): Observable<ApiResponse<{test_mode: boolean; institutional_domains: string[]}>> {
    return this.http.get<ApiResponse<{test_mode: boolean; institutional_domains: string[]}>>(`${this.publicUrl}/configuration`);
  }

  availableChannels(payload: Pick<SupportRequestSubmission, 'requester_type'|'document_number'|'student_code'>): Observable<ApiResponse<AvailableChannels>> {
    return this.http.post<ApiResponse<AvailableChannels>>(`${this.publicUrl}/available-channels`, payload);
  }

  submit(payload: SupportRequestSubmission): Observable<ApiResponse<PublicSupportRequest>> {
    return this.http.post<ApiResponse<PublicSupportRequest>>(this.publicUrl, payload);
  }
  verify(ticket: string, code: string): Observable<ApiResponse<PublicSupportRequest>> {
    return this.http.post<ApiResponse<PublicSupportRequest>>(`${this.publicUrl}/${ticket}/verify`, {code});
  }
  list(filters: Record<string, string | number>): Observable<ApiResponse<Page<AdminSupportRequest>>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (`${value}`.trim()) params = params.set(key, `${value}`); });
    return this.http.get<ApiResponse<Page<AdminSupportRequest>>>(this.adminUrl, {params});
  }
  show(ticket: string): Observable<ApiResponse<AdminSupportRequest>> {
    return this.http.get<ApiResponse<AdminSupportRequest>>(`${this.adminUrl}/${ticket}`);
  }
  update(ticket: string, status: string, notes: string): Observable<ApiResponse<AdminSupportRequest>> {
    return this.http.patch<ApiResponse<AdminSupportRequest>>(`${this.adminUrl}/${ticket}`, {status, notes});
  }
  executeRecovery(ticket: string): Observable<ApiResponse<AdminSupportRequest>> {
    return this.http.post<ApiResponse<AdminSupportRequest>>(`${this.adminUrl}/${ticket}/execute-recovery`, {});
  }
}
