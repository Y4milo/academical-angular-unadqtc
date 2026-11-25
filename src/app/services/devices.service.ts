import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {ApiData} from '../models/api/api-data.model';

/** A browser where the person has Academical open. `key` names it without giving away the session. */
export interface BrowserSession {
  key: string;
  current: boolean;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string | null;
  platform: string | null;
  ip_address: string | null;
  last_seen_at: string;
  started_at: string | null;
  auth_via: 'core' | 'local';
}

export interface DevicesData {
  sessions: BrowserSession[];
  /** How this session was opened: with Core, closing here only closes Academical. */
  auth_via: 'core' | 'local';
  /** Core's «Dispositivos y sesiones», when it is configured. */
  core_devices_url: string | null;
}

/** «Dispositivos y sesiones» of the staff person: list the open sessions, close one or all the others. */
@Injectable({providedIn: 'root'})
export class DevicesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users/v1/devices`;

  list(): Observable<ApiData<DevicesData>> {
    return this.http.get<ApiData<DevicesData>>(this.url);
  }

  close(key: string): Observable<ApiData<unknown>> {
    return this.http.delete<ApiData<unknown>>(`${this.url}/${encodeURIComponent(key)}`);
  }

  closeOthers(): Observable<ApiData<{closed: number}>> {
    return this.http.post<ApiData<{closed: number}>>(`${this.url}/close-others`, {});
  }
}
