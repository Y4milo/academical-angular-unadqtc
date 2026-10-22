import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type AccountKind = 'person' | 'functional' | 'service';

/** Estado del titular de una cuenta funcional: `none` = sin titular vigente, `expired` = su orden de servicio venció. */
export type HolderState = 'current' | 'expired' | 'none';

export interface AccountRow {
  id: number;
  nick: string;
  kind: AccountKind;
  display_name: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
  last_login_at: string | null;
  holder_state: HolderState | null;
  holder_valid_to: string | null;
}

export interface AccountSummary {
  id: number;
  nick: string;
  kind: AccountKind;
  display_name: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
  last_login_at: string | null;
}

export interface AccountHolder {
  id: number;
  core_person_id: number;
  /** Nombre que responde Core; null si Core no responde o no tiene a la persona. */
  name: string | null;
  service_order: string;
  valid_from: string;
  valid_to: string | null;
  closed_at: string | null;
  close_reason: string | null;
  registered_by: number;
  is_current: boolean;
  is_expired: boolean;
}

export interface AccountHolders {
  account: AccountSummary;
  kind: AccountKind;
  holders: AccountHolder[];
}

export interface CorePersonLookup {
  person_id: number;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
}

export interface AssignHolderInput {
  document_type: string;
  document_number: string;
  service_order: string;
  valid_from: string;
  valid_to: string | null;
  /** Si hay un titular vigente, se cierra con este motivo en el mismo paso. */
  replace_reason?: string;
}

/** Cuentas funcionales y de servicio, y quién usa cada funcional. Solo administrador. */
@Injectable({ providedIn: 'root' })
export class UserAccountsService {
  private readonly apiURL = `${environment.apiUrl}/users/v1/accounts`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiData<AccountRow[]>> {
    return this.http.get<ApiData<AccountRow[]>>(this.apiURL);
  }

  holders(userId: number): Observable<ApiData<AccountHolders>> {
    return this.http.get<ApiData<AccountHolders>>(`${this.apiURL}/${userId}/holders`);
  }

  lookupPerson(documentType: string, documentNumber: string): Observable<ApiData<CorePersonLookup | null>> {
    return this.http.post<ApiData<CorePersonLookup | null>>(`${this.apiURL}/lookup-person`, { document_type: documentType, document_number: documentNumber });
  }

  assign(userId: number, input: AssignHolderInput): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/${userId}/holders`, input);
  }

  close(userId: number, holderId: number, reason: string): Observable<ApiData<unknown>> {
    return this.http.post<ApiData<unknown>>(`${this.apiURL}/${userId}/holders/${holderId}/close`, { reason });
  }
}
