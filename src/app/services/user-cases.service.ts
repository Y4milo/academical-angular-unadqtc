import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type CaseCode = 'not_linked' | 'separated_active' | 'duplicate_link' | 'profile_missing' | 'functional_without_holder' | 'holder_expired' | 'inactive';
export type CaseStatus = 'open' | 'in_management' | 'postponed' | 'resolved';
export type CaseAction = 'suspend' | 'keep' | 'postpone' | 'manage' | 'reopen';
export type SuggestedAction = 'suspend' | 'review' | 'assign_holder';

export interface UserCase {
  id: number;
  user_id: number;
  nick: string;
  display_name: string | null;
  account_kind: string;
  role: string | null;
  user_status: string | null;
  last_login_at: string | null;
  code: CaseCode;
  status: CaseStatus;
  suggested_action: SuggestedAction | null;
  detail: string | null;
  detected_at: string;
  postponed_until: string | null;
  resolved_at: string | null;
  resolution: string | null;
  note: string | null;
  managed_by: number | null;
}

export interface UserCasesPage {
  cases: UserCase[];
  total: number;
  page: number;
  per_page: number;
  summary: { by_status: Partial<Record<CaseStatus, number>>; open_by_code: Partial<Record<CaseCode, number>> };
}

export interface UserCaseFilters {
  status: CaseStatus[];
  code?: CaseCode | null;
  search?: string;
}

export interface CaseActionInput {
  action: CaseAction;
  note?: string | null;
  until?: string | null;
}

export interface CaseActionResult {
  case_id: number;
  user_id: number | null;
  nick: string | null;
  outcome: 'applied' | 'would_apply' | 'skipped';
  reason: string | null;
}

export interface CaseActionResponse {
  dry_run: boolean;
  summary: { applied: number; would_apply: number; skipped: number };
  results: CaseActionResult[];
}

/** Bandeja de depuración de usuarios: casos abiertos por la reconciliación con Core y las acciones para cerrarlos. Solo administrador. */
@Injectable({ providedIn: 'root' })
export class UserCasesService {
  private readonly apiURL = `${environment.apiUrl}/users/v1/cases`;

  constructor(private http: HttpClient) {}

  list(filters: UserCaseFilters, page: number, perPage: number): Observable<ApiData<UserCasesPage>> {
    return this.http.get<ApiData<UserCasesPage>>(this.apiURL, { params: this.params(filters).set('page', page).set('per_page', perPage) });
  }

  export(filters: UserCaseFilters): Observable<Blob> {
    return this.http.get(`${this.apiURL}/export`, { params: this.params(filters), responseType: 'blob' });
  }

  /** Aplica una acción a uno o varios casos; con `dryRun` solo informa qué pasaría con cada uno. */
  apply(caseIds: number[], input: CaseActionInput, dryRun: boolean): Observable<ApiData<CaseActionResponse>> {
    return this.http.post<ApiData<CaseActionResponse>>(`${this.apiURL}/batch`, { case_ids: caseIds, dry_run: dryRun, ...input });
  }

  private params(filters: UserCaseFilters): HttpParams {
    let params = new HttpParams();
    filters.status.forEach(status => (params = params.append('status[]', status)));
    if (filters.code) {
      params = params.set('code', filters.code);
    }
    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    return params;
  }
}
