import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type ValidationCaseType = 'possible_duplicate' | 'name_mismatch';

/** Cómo comprobó Core la identidad de la persona, tal cual lo registró (fuente y fecha reales) y si esa fuente basta para corregir el documento. */
export interface IdentityProof {
  verified_at: string | null;
  source: string | null;
  source_label: string;
  trusted: boolean;
}

export interface ValidationCase {
  id: number;
  type: ValidationCaseType;
  strength: 'high' | 'medium';
  detected_at: string;
  core: {
    person_id: number;
    name: string;
    document: string;
    profile_type: string;
    email: string | null;
    identity: IdentityProof;
  } | null;
  academical: {
    staff_id: number;
    name: string;
    document: string;
    email: string | null;
    user: { id: number; nick: string; last_login_at: string | null; linked: boolean } | null;
  } | null;
  same_document: boolean;
  same_name: boolean;
  can_confirm: boolean;
  confirm_blocked_reason: string | null;
  can_create: boolean;
  can_unlink: boolean;
}

export interface ValidationSummary {
  counts: { to_decide: number; to_create: number; without_core: number; resolved: number };
  cases: ValidationCase[];
}

export interface ToCreateRow {
  core_person_id: number;
  name: string;
  profile_type: string;
  dependency: string | null;
  blocked_reason: string | null;
}

export interface WithoutCoreRow {
  id: number;
  nick: string;
  name: string;
  last_login_at: string | null;
  reason?: string;
}

export interface WithoutCore {
  to_suspend: WithoutCoreRow[];
  blocked: WithoutCoreRow[];
}

/** Validación de cuentas: los casos que Academical no decide solo, las personas de Core sin cuenta y los usuarios que no están en Core. Solo administrador. */
@Injectable({ providedIn: 'root' })
export class AccountValidationService {
  private readonly apiURL = `${environment.apiUrl}/users/v1/validation`;

  constructor(private http: HttpClient) {}

  summary(): Observable<ApiData<ValidationSummary>> {
    return this.http.get<ApiData<ValidationSummary>>(this.apiURL);
  }

  detect(): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/detect`, {});
  }

  confirm(caseId: number): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/cases/${caseId}/confirm`, {});
  }

  createAccount(caseId: number): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/cases/${caseId}/create-account`, {});
  }

  unlink(caseId: number): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/cases/${caseId}/unlink`, {});
  }

  toCreate(): Observable<ApiData<ToCreateRow[]>> {
    return this.http.get<ApiData<ToCreateRow[]>>(`${this.apiURL}/to-create`);
  }

  createMany(corePersonIds: number[]): Observable<ApiData<{ created: number; skipped: { core_person_id: number; reason: string }[] }>> {
    return this.http.post<ApiData<{ created: number; skipped: { core_person_id: number; reason: string }[] }>>(`${this.apiURL}/to-create`, { core_person_ids: corePersonIds });
  }

  withoutCore(): Observable<ApiData<WithoutCore>> {
    return this.http.get<ApiData<WithoutCore>>(`${this.apiURL}/without-core`);
  }

  suspendWithoutCore(userIds?: number[]): Observable<ApiData<{ suspended: number }>> {
    return this.http.post<ApiData<{ suspended: number }>>(`${this.apiURL}/without-core/suspend`, userIds ? { user_ids: userIds } : {});
  }
}
