import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface AccountingBnFilter {
  start_date?: string;
  end_date?: string;
  operation?: string;
  status?: string;
  file_type?: string;
  ip_status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AccountingBnOptionTotal {
  value?: string;
  label?: string;
  file_type?: string;
  total: number;
}

export type AccountingBnIpStatus = 'allowed' | 'unknown' | 'unverified';

export interface AccountingBnIpItem {
  ip_address: string;
  status: AccountingBnIpStatus;
  total: number;
  last_seen: string | null;
}

export interface AccountingBnIpSummary {
  items: AccountingBnIpItem[];
  distinct: number;
  unknown: number;
  unverified_total: number;
  allowed_ips: string[];
  blocks_unknown: boolean;
}

export interface AccountingBnTransaction {
  id: number;
  request_date: string | null;
  created_at: string | null;
  created_at_lima: string | null;
  display_date: string | null;
  file_type: string | null;
  file_name: string | null;
  file_path: string | null;
  has_local_file: boolean;
  file_size: number | null;
  operation: {
    value: string | null;
    label: string | null;
  };
  status: {
    value: string | null;
    label: string | null;
  };
  message: string | null;
  attempt: number;
  extra_data: Record<string, unknown> | null;
  ip_address: string | null;
  ip_status: AccountingBnIpStatus;
  user_agent: string | null;
  user: {
    id: number | null;
    number: string | null;
    full_name: string | null;
  };
}

export interface AccountingBnSummary {
  total: number;
  success: number;
  errors: number;
  latest_transaction: AccountingBnTransaction | null;
  latest_incident: AccountingBnTransaction | null;
  by_operation: AccountingBnOptionTotal[];
  by_file_type: AccountingBnOptionTotal[];
  ips: AccountingBnIpSummary;
}

export interface AccountingBnOrigin {
  id: number;
  ip_address: string;
  label: string | null;
  notes: string | null;
  is_active: boolean;
  total: number;
  last_seen: string | null;
}

export interface AccountingBnDetectedIp {
  ip_address: string;
  total: number;
  last_seen: string | null;
}

export interface AccountingBnConfigLog {
  action: string;
  subject: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
  staff: string | null;
}

export interface AccountingBnConfig {
  block_unknown_ips: boolean;
  origins: AccountingBnOrigin[];
  detected: AccountingBnDetectedIp[];
  logs: AccountingBnConfigLog[];
  connection: {
    sftp_host: string | null;
    upload_cutoff: string;
  };
}

export interface AccountingBnPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface AccountingBnListResponse {
  items: AccountingBnTransaction[];
  pagination: AccountingBnPagination;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingBnService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  summary(filters: AccountingBnFilter): Observable<ApiData<AccountingBnSummary>> {
    return this.http.get<ApiData<AccountingBnSummary>>(
      `${this.apiURL}/accounting/bn/summary`,
      { params: this.toParams(filters) }
    );
  }

  transactions(filters: AccountingBnFilter): Observable<ApiData<AccountingBnListResponse>> {
    return this.http.get<ApiData<AccountingBnListResponse>>(
      `${this.apiURL}/accounting/bn/transactions`,
      { params: this.toParams(filters) }
    );
  }

  config(): Observable<ApiData<AccountingBnConfig>> {
    return this.http.get<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config`);
  }

  addOrigin(body: { ip_address: string; label?: string; notes?: string }): Observable<ApiData<AccountingBnConfig>> {
    return this.http.post<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/origins`, body);
  }

  updateOrigin(
    id: number,
    body: { label?: string | null; notes?: string | null; is_active?: boolean },
  ): Observable<ApiData<AccountingBnConfig>> {
    return this.http.patch<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/origins/${id}`, body);
  }

  removeOrigin(id: number): Observable<ApiData<AccountingBnConfig>> {
    return this.http.delete<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/origins/${id}`);
  }

  ignoreIp(ipAddress: string): Observable<ApiData<AccountingBnConfig>> {
    return this.http.post<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/ignore`, { ip_address: ipAddress });
  }

  setMode(blockUnknownIps: boolean): Observable<ApiData<AccountingBnConfig>> {
    return this.http.patch<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/mode`, {
      block_unknown_ips: blockUnknownIps,
    });
  }

  download(transactionId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiURL}/accounting/bn/transactions/${transactionId}/download`,
      { responseType: 'blob' }
    );
  }

  private toParams(filters: AccountingBnFilter): HttpParams {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    });

    return params;
  }
}
