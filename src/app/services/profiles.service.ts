import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type ProfileOrigin = 'system' | 'custom';

export interface ProfileItem {
  code: string;
  name: string;
  description: string | null;
  module: string;
  origin: ProfileOrigin;
  permissions: string[];
  permission_count: number;
  /** Personas que lo tienen vigente, por su rol de hoy o por asignación. */
  people: number;
  /** Lo último que Core respondió (pending, active, inactive, retired); null si nunca se publicó. */
  core_status: string | null;
  retired: boolean;
  can_edit: boolean;
  created_by: number | null;
}

export interface PermissionOption {
  code: string;
  label: string;
  /** Si es el permiso de todo un módulo, las pantallas que incluye. */
  includes?: string[];
}

export interface ProfilesIndex {
  profiles: ProfileItem[];
  /** Solo el administrador publica a Core: la lista lo avisa para mostrar u ocultar el botón. */
  can_publish?: boolean;
  /** Los permisos que quien pide puede poner en un perfil propio, por módulo. */
  permissions: Record<string, PermissionOption[]>;
}

export interface ProfilePerson {
  id: number;
  nick: string;
  name: string | null;
  other_profiles: string[];
}

export interface ProfileEvent {
  action: 'created' | 'updated' | 'retired';
  actor_id: number | null;
  reason: string | null;
  at: string;
}

export interface ProfileDetail {
  profile: ProfileItem;
  people_count: number;
  people: ProfilePerson[];
  history: ProfileEvent[];
}

/** Un grupo del menú que abriría un perfil: su nombre y las pantallas con su dirección. */
export interface MenuPreviewGroup {
  label: string;
  icon?: string;
  items: { label: string; routerLink: string }[];
}

export interface CorePublication {
  id: number;
  status: 'sent' | 'failed';
  profile_count: number;
  summary: { created: string[]; updated: string[]; retired: string[]; unchanged: string[] } | null;
  error: string | null;
  actor: string | null;
  created_at: string;
}

export interface CorePublicationStatus {
  last: CorePublication | null;
  history: CorePublication[];
  /** Los perfiles propios con lo último que Core dijo de cada uno. */
  profiles: { code: string; name: string; core_status: string | null; retired: boolean }[];
}

export interface ProfileInput {
  name: string;
  description: string | null;
  module?: string;
  permissions: string[];
  /** Cambiar los permisos de un perfil con personas pide confirmar: el API responde 409 `needs_confirmation` hasta que se envía true. */
  confirmed?: boolean;
}

/** Perfiles propios: el administrador administra todos y Recursos humanos solo los suyos de Asistencia (lo exige el API). */
@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly apiURL = `${environment.apiUrl}/authz/profiles`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiData<ProfilesIndex>> {
    return this.http.get<ApiData<ProfilesIndex>>(this.apiURL);
  }

  show(code: string): Observable<ApiData<ProfileDetail>> {
    return this.http.get<ApiData<ProfileDetail>>(`${this.apiURL}/${code}`);
  }

  create(input: ProfileInput): Observable<ApiData<ProfileItem>> {
    return this.http.post<ApiData<ProfileItem>>(this.apiURL, input);
  }

  update(code: string, input: ProfileInput): Observable<ApiData<ProfileItem>> {
    return this.http.put<ApiData<ProfileItem>>(`${this.apiURL}/${code}`, input);
  }

  /** El menú que abrirían estos permisos, con los mismos límites que crear (Recursos humanos solo ve los de Asistencia). */
  previewMenu(permissions: string[]): Observable<ApiData<MenuPreviewGroup[]>> {
    return this.http.post<ApiData<MenuPreviewGroup[]>>(`${this.apiURL}/preview-menu`, { permissions });
  }

  /** Estado de la publicación a Core: la última, el historial y el estado de cada perfil propio. Solo administrador. */
  coreStatus(): Observable<ApiData<CorePublicationStatus>> {
    return this.http.get<ApiData<CorePublicationStatus>>(`${this.apiURL}/core`);
  }

  /** Envía a Core la lista completa de perfiles. Si Core falla, el API responde 502 y el intento queda en el historial. */
  publishToCore(): Observable<ApiData<CorePublicationStatus>> {
    return this.http.post<ApiData<CorePublicationStatus>>(`${this.apiURL}/core/publish`, {});
  }

  /** Envía a Core la foto de las personas vinculadas con su rol y sus permisos, para su conciliación. Solo administrador. */
  publishPeopleToCore(): Observable<ApiData<{ people: number; received: number }>> {
    return this.http.post<ApiData<{ people: number; received: number }>>(`${this.apiURL}/core/people`, {});
  }

  retire(code: string, reason: string): Observable<ApiData<ProfileItem>> {
    return this.http.delete<ApiData<ProfileItem>>(`${this.apiURL}/${code}`, { body: { reason } });
  }
}

/** Nombre de cada módulo de permisos, como se muestra. */
export const MODULE_LABELS: Record<string, string> = {
  general: 'General',
  attendance: 'Asistencia',
  accounting: 'Contabilidad',
  student_card: 'Carnet universitario',
  academic: 'Académico',
  welfare: 'Bienestar',
  degrees_titles: 'Grados y títulos',
  service_orders: 'Órdenes de servicio',
  users: 'Usuarios',
  support: 'Soporte',
  directives: 'Documentos de gestión',
  interface: 'Interfaz',
  other: 'Otro',
};

/** El mensaje y el motivo que el API devuelve en un error (`payload.message`, `payload.reason`, `payload.people`). */
export function profileError(error: unknown): { message: string; reason: string | null; people: number | null } {
  const payload = (error as { error?: { payload?: { message?: string; reason?: string; people?: number } } })?.error?.payload;

  return { message: payload?.message ?? 'No se pudo completar. Inténtalo de nuevo.', reason: payload?.reason ?? null, people: payload?.people ?? null };
}
