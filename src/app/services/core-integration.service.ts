import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface CoreIntegrationValues {
  sso: 'on' | 'off';
  mode: 'optional' | 'required';
}

export interface CoreIntegrationCheck {
  ok: boolean;
  label: string;
  detail: string;
}

export interface CoreIntegrationChange {
  key: keyof CoreIntegrationValues;
  old: string | null;
  new: string;
  by: string | null;
  at: string | null;
}

export interface CoreIntegrationSettings {
  values: CoreIntegrationValues;
  defaults: CoreIntegrationValues;
  checks: Record<string, CoreIntegrationCheck>;
  history: CoreIntegrationChange[];
}

/** La integración con Core que maneja el administrador: si se entra con la cuenta de Core y si es obligatorio. */
@Injectable({ providedIn: 'root' })
export class CoreIntegrationService {
  private readonly http = inject(HttpClient);

  settings(): Observable<ApiData<CoreIntegrationSettings>> {
    return this.http.get<ApiData<CoreIntegrationSettings>>(`${environment.apiUrl}/system/core-integration`);
  }

  update(values: Partial<CoreIntegrationValues>): Observable<ApiData<CoreIntegrationSettings>> {
    return this.http.patch<ApiData<CoreIntegrationSettings>>(`${environment.apiUrl}/system/core-integration`, values);
  }
}
