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
