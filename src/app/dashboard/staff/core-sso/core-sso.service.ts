import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiData } from '../../../models/api/api-data.model';
import { StaffUser } from '../../../models/staff-user.model';

/** Por qué no se pudo entrar con la cuenta de Core, en palabras de la persona (los códigos los fija el API). */
export const CORE_SSO_ERRORS: Record<string, string> = {
  disabled: 'El ingreso con Core no está activado. Entra con tu usuario y contraseña de Academical.',
  access_denied: 'Cancelaste el ingreso con Core. Puedes intentarlo otra vez o entrar con tu usuario y contraseña.',
  not_linked: 'Tu cuenta de Core todavía no está vinculada a un usuario de Academical. Pídele a OTI que la vincule o entra con tu usuario y contraseña.',
  inactive: 'Tu usuario de Academical está inactivo. Comunícate con OTI.',
  core_unreachable: 'No se pudo conectar con Core. Inténtalo nuevamente en unos minutos o entra con tu usuario y contraseña.',
};

export const CORE_SSO_GENERIC_ERROR = 'No se pudo completar el ingreso con Core. Inténtalo nuevamente o entra con tu usuario y contraseña.';

export const coreSsoErrorMessage = (code: string | null): string => (code ? CORE_SSO_ERRORS[code] ?? CORE_SSO_GENERIC_ERROR : '');

export interface CoreSsoStatus {
  enabled: boolean;
  required?: boolean;
  portal_url?: string | null;
}

export interface CoreSsoFailure {
  reason: string;
  reference: string;
  account: { name: string | null; email: string | null } | null;
}

/** El ingreso con la cuenta de Core: si Academical está integrada, a dónde mandar a la persona y cómo armar su sesión al volver. */
@Injectable({ providedIn: 'root' })
export class CoreSsoService {
  private readonly http = inject(HttpClient);

  /**
   * `enabled`: Academical está integrada a Core para el ingreso. `required`: además el ingreso de Academical no debe aparecer (modo obligatorio y
   * Core responde). `portal_url`: la pantalla de Core a la que se vuelve.
   */
  status(): Observable<CoreSsoStatus> {
    return this.http.get<CoreSsoStatus>(`${environment.apiUrl}/auth/core/status`);
  }

  /** Qué pasó en el último intento de ingreso con Core de este navegador (motivo, código de referencia y quién entró en Core). */
  failure(): Observable<{ failure: CoreSsoFailure | null }> {
    return this.http.get<{ failure: CoreSsoFailure | null }>(`${environment.apiUrl}/auth/core/failure`);
  }

  /** La dirección del API que manda a Core; es una navegación completa, no una llamada XHR. */
  redirectUrl(): string {
    return `${environment.apiUrl}/auth/core/redirect`;
  }

  /** Navegación completa del navegador (se separa para poder probarla). */
  goTo(url: string): void {
    window.location.assign(url);
  }

  /** Cambia el código de un solo uso que trae la dirección de retorno por la sesión de la persona (el API la abre en esta llamada). */
  exchange(code: string): Observable<ApiData<StaffUser>> {
    return this.http.post<ApiData<StaffUser>>(`${environment.apiUrl}/auth/core/exchange`, { code });
  }

  /** La cuenta con la sesión ya abierta. Solo para un API anterior al código de un solo uso. */
  session(): Observable<ApiData<StaffUser>> {
    return this.http.get<ApiData<StaffUser>>(`${environment.apiUrl}/auth/core/session`);
  }
}
