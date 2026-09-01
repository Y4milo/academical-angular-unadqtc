import {Injectable} from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {ApiData} from '../models/api/api-data.model';

export type DegreeCallStatusValue = 'draft' | 'open' | 'closed' | 'exported' | 'annulled';

export interface DegreeCallStatus {
  id: number;
  value: DegreeCallStatusValue;
  label: string;
}

export interface DegreeCall {
  id: number;
  name: string;
  resolution_number: string | null;
  resolution_date: string | null;
  status: DegreeCallStatus;
  records_count: number;
  exports_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DegreeCallPayload {
  name: string;
  resolution_number: string | null;
  resolution_date: string | null;
}

export interface DegreeCallListResponse {
  data: DegreeCall[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DegreeCallMutationPayload {
  message: string;
  data: DegreeCall;
}

export interface DegreeCatalogOption {
  id: number;
  value?: string;
  label?: string;
  name?: string;
  resolution_number?: string | null;
  resolution_date?: string | null;
}

export interface DegreeStudent {
  id: number;
  code: string;
  document_number: string;
  document_type: string | null;
  document_type_code: string | null;
  names: string;
  father_last_name: string;
  mother_last_name: string | null;
  full_name: string;
  gender: string | null;
  personal_email: string | null;
  institutional_email: string | null;
  institutional_email_status: string | null;
  institutional_email_source: 'student' | 'legacy_email' | 'generated_candidate' | 'test';
  institutional_email_verified: boolean;
  major: string | null;
  faculty: DegreeCatalogReference | null;
  career: DegreeCatalogReference | null;
  program: DegreeCatalogReference | null;
  specialty: string | null;
  academic_data_complete: boolean;
}

export interface DegreeCatalogReference {
  id: number;
  code: string;
  label: string;
  metadata?: Record<string, unknown> | null;
}

export interface DegreeAcademicDenomination extends DegreeCatalogReference {
  degree_type_id: number;
  degree_type_code: string;
  specialty_required: boolean;
}

export interface DegreeAcademicProgram extends DegreeCatalogReference {
  specialty: string | null;
}

export interface DegreeAcademicCareer extends DegreeCatalogReference {
  requires_specialty: boolean;
  programs: DegreeAcademicProgram[];
  denominations: DegreeAcademicDenomination[];
}

export interface DegreeAcademicFaculty extends DegreeCatalogReference {
  careers: DegreeAcademicCareer[];
}

export interface DegreeRecord {
  id: number;
  degree_call_id: number;
  call: {id: number; name: string; status: {value: string; label: string}};
  student_id: number;
  barcode: string;
  student_code: string;
  document_type: string | null;
  document_type_label: string | null;
  document_number: string;
  gender: 'M' | 'F' | null;
  faculty_id: number | null;
  professional_career_id: number | null;
  degree_program_id: number | null;
  degree_denomination_id: number | null;
  full_name: string;
  faculty: string | null;
  major: string | null;
  specialty: string | null;
  degree_type: DegreeCatalogOption;
  diploma_issue_type: DegreeCatalogOption | null;
  status: DegreeCatalogOption;
  degree_denomination: string;
  resolution_number: string | null;
  resolution_date: string | null;
  diploma_number: string | null;
  diploma_date: string | null;
  registry_book: string | null;
  registry_folio: string | null;
  registry_number: string | null;
  sunedu_schema_version: string;
  sunedu_data: Record<string, string | number | null>;
  ethnicity_form: {
    generated: boolean; expires_at: string | null; submitted_at: string | null;
    email_recipient: string | null; email_status: string | null; email_sent_at: string | null;
    email_intended_recipient: string | null; email_test_mode: boolean;
  };
  institutional_identity: {
    personal_email: string | null; institutional_email: string | null; status: string | null;
    verified_at: string | null; synced_at: string | null;
  };
}

export interface InstitutionalIdentityLookup {
  status?: 'verified' | 'confirmed' | 'probable' | 'review_required' | 'not_match' | 'not_found' | 'pending' | 'test' | 'invalid_domain';
  institutional_email?: string | null;
  institutional_email_source?: string;
  comparison?: {
    status: 'confirmed' | 'probable' | 'review_required' | 'not_match'; score: number;
    verified_100: boolean;
    checks: {code: boolean; at_least_one_name: boolean; father_last_name: boolean; mother_last_name: boolean;
      email_address?: boolean; account_enabled?: boolean};
    differences: string[];
  };
  academical?: {code: string; full_name: string; personal_email: string | null};
  microsoft?: {
    id: string; userPrincipalName: string; mail: string | null; displayName: string;
    givenName: string | null; surname: string | null; accountEnabled: boolean; department: string | null;
  };
}

export interface EthnicityOption { code: string; label: string; }
export interface PublicEthnicityForm {
  student: {full_name: string; student_code: string; document: string};
  degree: {denomination: string; call: string | null};
  catalogs: {ethnic_options: EthnicityOption[]; language_options: EthnicityOption[]; peoples: EthnicityOption[]; languages: EthnicityOption[]};
  submitted: boolean;
  expires_at: string;
  test_mode: boolean;
}

export interface DegreeRecordPayload {
  degree_call_id?: number;
  student_id?: number;
  degree_type_id: number;
  gender: 'M' | 'F' | null;
  diploma_issue_type_id: number | null;
  faculty_id: number;
  professional_career_id: number;
  degree_program_id: number | null;
  degree_denomination_id: number;
  resolution_number: string | null;
  resolution_date: string | null;
  diploma_number: string | null;
  diploma_date: string | null;
  registry_book: string | null;
  registry_folio: string | null;
  registry_number: string | null;
  sunedu_data: Record<string, string | number | null>;
}

@Injectable({providedIn: 'root'})
export class DegreesTitlesService {
  private readonly apiURL = `${environment.apiUrl}/degrees-titles`;

  constructor(private http: HttpClient) {}

  listCalls(filters: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Observable<DegreeCallListResponse> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<DegreeCallListResponse>(`${this.apiURL}/calls`, {params});
  }

  createCall(payload: DegreeCallPayload): Observable<ApiData<DegreeCallMutationPayload>> {
    return this.http.post<ApiData<DegreeCallMutationPayload>>(`${this.apiURL}/calls`, payload);
  }

  updateCall(id: number, payload: DegreeCallPayload): Observable<ApiData<DegreeCallMutationPayload>> {
    return this.http.put<ApiData<DegreeCallMutationPayload>>(`${this.apiURL}/calls/${id}`, payload);
  }

  openCall(id: number): Observable<ApiData<DegreeCallMutationPayload>> {
    return this.http.patch<ApiData<DegreeCallMutationPayload>>(`${this.apiURL}/calls/${id}/open`, {});
  }

  closeCall(id: number): Observable<ApiData<DegreeCallMutationPayload>> {
    return this.http.patch<ApiData<DegreeCallMutationPayload>>(`${this.apiURL}/calls/${id}/close`, {});
  }

  annulCall(id: number): Observable<ApiData<DegreeCallMutationPayload>> {
    return this.http.delete<ApiData<DegreeCallMutationPayload>>(`${this.apiURL}/calls/${id}`);
  }

  getRecordCatalogs(): Observable<{data: {
    degree_types: DegreeCatalogOption[];
    diploma_issue_types: DegreeCatalogOption[];
    academic_tree: DegreeAcademicFaculty[];
    open_calls: DegreeCatalogOption[];
    sunedu_schema: {
      version: string;
      fields: string[];
      date_fields: string[];
      automatic_fields: string[];
    };
    mail_delivery: {test_mode: boolean; test_recipient: string | null};
  }}> {
    return this.http.get<any>(`${this.apiURL}/record-catalogs`);
  }

  searchStudents(search: string): Observable<{data: DegreeStudent[]}> {
    return this.http.get<{data: DegreeStudent[]}>(`${this.apiURL}/students/search`, {
      params: new HttpParams().set('search', search),
    });
  }

  checkStudentInstitutionalIdentity(id: number): Observable<ApiData<any>> {
    return this.http.get<ApiData<any>>(`${this.apiURL}/students/${id}/institutional-identity`);
  }

  listRecords(filters: {call_id?: number | null; search?: string; status?: string; page?: number; per_page?: number}): Observable<{
    data: DegreeRecord[];
    meta: {current_page: number; last_page: number; per_page: number; total: number};
  }> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<any>(`${this.apiURL}/records`, {params});
  }

  createRecord(payload: DegreeRecordPayload): Observable<ApiData<{message: string; data: DegreeRecord}>> {
    return this.http.post<ApiData<{message: string; data: DegreeRecord}>>(`${this.apiURL}/records`, payload);
  }

  updateRecord(id: number, payload: DegreeRecordPayload): Observable<ApiData<{message: string; data: DegreeRecord}>> {
    return this.http.put<ApiData<{message: string; data: DegreeRecord}>>(`${this.apiURL}/records/${id}`, payload);
  }

  annulRecord(id: number): Observable<ApiData<{message: string; data: DegreeRecord}>> {
    return this.http.delete<ApiData<{message: string; data: DegreeRecord}>>(`${this.apiURL}/records/${id}`);
  }

  downloadDegreeRecordPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiURL}/records/${id}/pdf`, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  createEthnicityLink(id: number): Observable<ApiData<{url: string; expires_at: string}>> {
    return this.http.post<ApiData<any>>(`${this.apiURL}/records/${id}/ethnicity-link`, {});
  }

  getPublicEthnicityForm(token: string): Observable<{data: PublicEthnicityForm}> {
    return this.http.get<{data: PublicEthnicityForm}>(`${environment.apiUrl}/public/degrees-titles/ethnicity/${token}`);
  }

  submitPublicEthnicityForm(token: string, payload: Record<string, string | boolean | null>): Observable<ApiData<any>> {
    return this.http.post<ApiData<any>>(`${environment.apiUrl}/public/degrees-titles/ethnicity/${token}`, payload);
  }

  checkInstitutionalIdentity(id: number): Observable<ApiData<InstitutionalIdentityLookup>> {
    return this.http.get<ApiData<InstitutionalIdentityLookup>>(`${this.apiURL}/records/${id}/institutional-identity`);
  }

  confirmInstitutionalIdentity(id: number): Observable<ApiData<InstitutionalIdentityLookup>> {
    return this.http.post<ApiData<InstitutionalIdentityLookup>>(`${this.apiURL}/records/${id}/institutional-identity/confirm`, {});
  }

  sendEthnicityFormEmail(id: number): Observable<ApiData<{recipient: string; intended_recipient: string; test_mode: boolean; sent_at: string}>> {
    return this.http.post<ApiData<any>>(`${this.apiURL}/records/${id}/ethnicity-email`, {});
  }
}
