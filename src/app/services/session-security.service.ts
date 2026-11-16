import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

/** Los tiempos con que se cierra sola una sesión de Academical. */
export interface SessionSecurityValues {
  idle_minutes: number;
  max_hours: number;
  warning_seconds: number;
}

export interface SessionSecuritySettings {
  values: SessionSecurityValues & { source: 'default' | 'database' };
  defaults: SessionSecurityValues;
  /** Rango válido de cada ajuste: [mínimo, máximo]. */
  limits: Record<keyof SessionSecurityValues, [number, number]>;
}

/** «Seguridad de sesión»: inactividad, duración máxima y aviso previo de las sesiones de Academical. */
@Injectable({ providedIn: 'root' })
export class SessionSecurityService {
  private readonly http = inject(HttpClient);

  settings(): Observable<ApiData<SessionSecuritySettings>> {
    return this.http.get<ApiData<SessionSecuritySettings>>(`${environment.apiUrl}/system/session-security`);
  }

  update(values: SessionSecurityValues): Observable<ApiData<SessionSecuritySettings>> {
    return this.http.put<ApiData<SessionSecuritySettings>>(`${environment.apiUrl}/system/session-security`, values);
  }
}
