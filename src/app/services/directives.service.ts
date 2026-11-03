import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type DirectiveStatus = 'draft' | 'in_signature' | 'returned' | 'signed' | 'cancelled';
export type DirectiveFileKind = 'directive' | 'resolution';

/** Lo que Core autoriza a la persona con las directivas, y el nombre de cada oficina por la que puede pedirlas. */
export interface DirectiveAccess {
  can_request: boolean;
  request_units: string[];
  request_unit_names: Record<string, string>;
  can_sign: boolean;
  sign_units: string[];
}

export interface DirectiveFileInfo {
  name: string;
  size: number;
  pages: number | null;
}

export interface DirectiveSummary {
  id: number;
  title: string;
  origin: { code: string; name: string };
  is_quality: boolean;
  status: DirectiveStatus;
  status_label: string;
  version: number;
  created_by: { id: number; nick: string | null };
  created_at: string | null;
  updated_at: string | null;
  can_edit: boolean;
  files: { directive: DirectiveFileInfo; resolution: DirectiveFileInfo } | null;
}

export interface DirectiveEvent {
  type: string;
  version: number | null;
  at: string | null;
  by: { id: number; nick: string | null } | null;
  data: Record<string, unknown>;
}

export interface DirectiveDetail extends DirectiveSummary {
  sha256: { directive: string; resolution: string } | null;
  events: DirectiveEvent[];
}

/** La persona que Core tiene designada hoy en una oficina, con el cargo ya escrito y su resolución. */
export interface RouteHolder {
  person_id: number;
  full_name: string;
  document_type: string | null;
  document_number: string | null;
  position: string | null;
  condition: 'titular' | 'encargado' | 'suplente' | null;
  title: string | null;
  starts_at: string | null;
  expires_at: string | null;
  note: string | null;
}

export interface RouteStep {
  key: string;
  label: string;
  unit: string;
  skipped: boolean;
  holder: RouteHolder | null;
  next: RouteHolder | null;
}

export interface DirectiveRoute {
  steps: RouteStep[];
  can_send: boolean;
  issues: { step: string; unit: string; reason: string }[];
}

/** Las directivas con firma digital: pedirlas, corregir el borrador y ver quién firma en cada oficina. Quién puede lo decide Core. */
@Injectable({ providedIn: 'root' })
export class DirectivesService {
  private readonly apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  access(): Observable<ApiData<DirectiveAccess>> {
    return this.http.get<ApiData<DirectiveAccess>>(`${this.apiURL}/directives/access`);
  }

  list(status?: DirectiveStatus | null): Observable<ApiData<DirectiveSummary[]>> {
    const params = status ? new HttpParams().set('status', status) : undefined;

    return this.http.get<ApiData<DirectiveSummary[]>>(`${this.apiURL}/directives`, { params });
  }

  detail(id: number): Observable<ApiData<DirectiveDetail>> {
    return this.http.get<ApiData<DirectiveDetail>>(`${this.apiURL}/directives/${id}`);
  }

  create(body: FormData): Observable<ApiData<DirectiveDetail>> {
    return this.http.post<ApiData<DirectiveDetail>>(`${this.apiURL}/directives`, body);
  }

  update(id: number, body: FormData): Observable<ApiData<DirectiveDetail>> {
    return this.http.post<ApiData<DirectiveDetail>>(`${this.apiURL}/directives/${id}`, body);
  }

  /** Envía el borrador al firmador con la ruta que Core tiene hoy; el servidor explica qué falta si no se puede. */
  send(id: number): Observable<ApiData<DirectiveDetail>> {
    return this.http.post<ApiData<DirectiveDetail>>(`${this.apiURL}/directives/${id}/send`, {});
  }

  remove(id: number): Observable<ApiData<unknown>> {
    return this.http.delete<ApiData<unknown>>(`${this.apiURL}/directives/${id}`);
  }

  /** Quién firma en cada oficina de la ruta, según Core; sin nadie en una oficina la ruta no se puede enviar. */
  route(origin: string, quality: boolean): Observable<ApiData<DirectiveRoute>> {
    const params = new HttpParams().set('origin', origin).set('quality', quality ? 1 : 0);

    return this.http.get<ApiData<DirectiveRoute>>(`${this.apiURL}/directives/route`, { params });
  }

  file(id: number, kind: DirectiveFileKind): Observable<Blob> {
    return this.http.get(`${this.apiURL}/directives/${id}/files/${kind}`, { responseType: 'blob' });
  }
}
