import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface AccountingBnFilter {
  month?: string;
  start_date?: string;
  end_date?: string;
  operation?: string;
  status?: string;
  file_type?: string;
  ip_status?: string;
  view?: string;
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

export interface AccountingBnClient {
  family: string;
  label: string;
  version: string | null;
  kind: 'integration' | 'manual' | 'browser' | 'script' | 'unknown';
  kind_label: string;
  os: string | null;
  is_manual: boolean;
  raw: string | null;
}

export interface AccountingBnClientSeen {
  client: AccountingBnClient;
  total: number;
  first_seen: string | null;
  last_seen: string | null;
  is_new: boolean;
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
  error_origin: { value: string; label: string } | null;
  is_expected: boolean;
  origin_label: string | null;
  ip_address: string | null;
  ip_status: AccountingBnIpStatus;
  user_agent: string | null;
  client: AccountingBnClient;
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

export type AccountingBnFileState = 'downloaded' | 'received' | 'waiting' | 'missing' | 'failed' | 'not_applicable';

export interface AccountingBnFileEntry {
  type: 'ING' | 'PAGOS' | 'REP' | 'DUP';
  state: AccountingBnFileState;
  name?: string;
  size?: number;
  published_at?: string | null;
  downloaded_at?: string | null;
  delivered_at?: string | null;
  transaction_id?: number | null;
  sha256?: string | null;
  attempts?: number;
  error?: string;
}

export interface AccountingBnFilesDay {
  date: string;
  weekday: string;
  is_today: boolean;
  holiday: string | null;
  files: Record<'ING' | 'PAGOS' | 'REP' | 'DUP', AccountingBnFileEntry>;
  has_problem: boolean;
  all_received: boolean;
  pagos_delivered: boolean;
}

export interface AccountingBnFilesMonth {
  month: string;
  is_current_month: boolean;
  days: AccountingBnFilesDay[];
  problems: number;
}

export interface AccountingBnCycleStep {
  label: string;
  window: string;
  state: 'ok' | 'pending' | 'missing' | 'error';
  at: string | null;
}

export interface AccountingBnAttention {
  kind: 'incident' | 'security';
  origin: string;
  title: string;
  count: number;
  detail: string | null;
  last_seen: string | null;
  ip_address?: string;
}

export interface AccountingBnOverview {
  cycle: AccountingBnCycleStep[];
  attention: AccountingBnAttention[];
  counters: { operations_7d: number; incidents_7d: number; rejections_24h: number };
}

export interface AccountingBnFilePreview {
  file_name: string;
  size: number;
  previewable: boolean;
  total_lines: number | null;
  lines: string[];
  sha256: string | null;
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

export interface AccountingBnSecuritySettings {
  rate_limit_enabled: boolean;
  rate_limit_max: number;
  rate_limit_cooldown_minutes: number;
  alert_enabled: boolean;
  alert_threshold: number;
  alert_window_minutes: number;
  alert_email_enabled: boolean;
  alert_email: string;
}

export interface AccountingBnBlockedIp {
  id: number;
  ip_address: string;
  label: string | null;
  blocked_at: string | null;
}

export type AccountingBnIpState = 'blocked' | 'limited' | 'watch' | 'info';

export interface AccountingBnSecurityItem {
  ip_address: string;
  total: number;
  main_reason: string | null;
  last_seen: string | null;
  state: AccountingBnIpState;
  limited_until: number | null;
}

export interface AccountingBnSecuritySummary {
  total: number;
  ips: number;
  over_limit: number;
  items: AccountingBnSecurityItem[];
}

export interface AccountingBnTraceItem {
  ip_address: string;
  label: string | null;
  status: AccountingBnIpStatus | 'blocked';
  total: number;
  rejected: number;
  first_seen: string | null;
  last_seen: string | null;
  limited_until: number | null;
  from_history: boolean;
}

export interface AccountingBnTraceList {
  items: AccountingBnTraceItem[];
  history_range: { from: string | null; to: string | null };
  rate_limit: { enabled: boolean; max: number };
}

export interface AccountingBnTraceEvent {
  at: string | null;
  source: 'app' | 'nginx';
  kind: 'ok' | 'error' | 'rejected';
  title: string;
  detail: string | null;
  chain: string | null;
  user_agent: string | null;
}

export interface AccountingBnTraceDetail {
  ip_address: string;
  label: string | null;
  status: AccountingBnIpStatus | 'blocked';
  origin_id: number | null;
  limited_until: number | null;
  user_agents: string[];
  clients: AccountingBnClientSeen[];
  paths: string[];
  events: AccountingBnTraceEvent[];
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
  security: AccountingBnSecuritySettings;
  blocked: AccountingBnBlockedIp[];
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

  securitySummary(): Observable<ApiData<AccountingBnSecuritySummary>> {
    return this.http.get<ApiData<AccountingBnSecuritySummary>>(`${this.apiURL}/accounting/bn/security`);
  }

  traces(): Observable<ApiData<AccountingBnTraceList>> {
    return this.http.get<ApiData<AccountingBnTraceList>>(`${this.apiURL}/accounting/bn/traces`);
  }

  trace(ip: string): Observable<ApiData<AccountingBnTraceDetail>> {
    return this.http.get<ApiData<AccountingBnTraceDetail>>(`${this.apiURL}/accounting/bn/traces/${encodeURIComponent(ip)}`);
  }

  updateSecurity(body: Partial<AccountingBnSecuritySettings>): Observable<ApiData<AccountingBnConfig>> {
    return this.http.patch<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/security`, body);
  }

  blockIp(ipAddress: string, label?: string): Observable<ApiData<AccountingBnConfig>> {
    return this.http.post<ApiData<AccountingBnConfig>>(`${this.apiURL}/accounting/bn/config/block`, { ip_address: ipAddress, label });
  }

  files(month?: string): Observable<ApiData<AccountingBnFilesMonth>> {
    return this.http.get<ApiData<AccountingBnFilesMonth>>(`${this.apiURL}/accounting/bn/files`, { params: this.toParams({ month } as AccountingBnFilter) });
  }

  filesDay(date: string): Observable<ApiData<AccountingBnFilesDay>> {
    return this.http.get<ApiData<AccountingBnFilesDay>>(`${this.apiURL}/accounting/bn/files/${date}`);
  }

  overview(): Observable<ApiData<AccountingBnOverview>> {
    return this.http.get<ApiData<AccountingBnOverview>>(`${this.apiURL}/accounting/bn/overview`);
  }

  preview(transactionId: number): Observable<ApiData<AccountingBnFilePreview>> {
    return this.http.get<ApiData<AccountingBnFilePreview>>(`${this.apiURL}/accounting/bn/transactions/${transactionId}/preview`);
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
