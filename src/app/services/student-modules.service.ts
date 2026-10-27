import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type StudentModuleKey = 'carnet' | 'dbu_appointments';

/** Un módulo que el estudiante ve en su menú: `open` si puede usarlo, `readonly` si solo lo consulta. */
export interface StudentModuleEntry {
  key: StudentModuleKey;
  label: string;
  state: 'open' | 'readonly';
  message: string | null;
}

export interface StudentModulesPayload {
  student: { name: string };
  modules: StudentModuleEntry[];
}

/** Interruptor general de un módulo (administrador). */
export interface StudentModuleSwitch {
  key: StudentModuleKey;
  label: string;
  description: string | null;
  enabled: boolean;
}

export interface StudentModuleSwitchesPayload {
  modules: StudentModuleSwitch[];
}

/** Módulos del estudiante: lo que ve en el menú y el interruptor general de cada uno. */
@Injectable({ providedIn: 'root' })
export class StudentModulesService {
  private readonly apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  mine(): Observable<ApiData<StudentModulesPayload>> {
    return this.http.get<ApiData<StudentModulesPayload>>(`${this.apiURL}/students/modules`);
  }

  list(): Observable<ApiData<StudentModuleSwitchesPayload>> {
    return this.http.get<ApiData<StudentModuleSwitchesPayload>>(`${this.apiURL}/academic/student-modules`);
  }

  setEnabled(key: StudentModuleKey, enabled: boolean): Observable<ApiData<StudentModuleSwitchesPayload>> {
    return this.http.patch<ApiData<StudentModuleSwitchesPayload>>(`${this.apiURL}/academic/student-modules/${key}`, { enabled });
  }

  logout(): Observable<ApiData<null>> {
    return this.http.post<ApiData<null>>(`${this.apiURL}/users/v1/student/logout`, {});
  }
}
