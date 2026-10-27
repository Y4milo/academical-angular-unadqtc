import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export type SemesterState = 'draft' | 'enabled' | 'current' | 'finished';

export interface Semester {
  id: number;
  name: string;
  label: string | null;
  start_date: string | null;
  end_date: string | null;
  state: SemesterState;
  card_start_date: string | null;
  card_end_date: string | null;
}

export interface SemestersPayload {
  semesters: Semester[];
}

/** Semestres: vigencia y habilitación. Administrador y académico. De un semestre habilitado cuelgan los módulos del estudiante. */
@Injectable({ providedIn: 'root' })
export class SemestersService {
  private readonly apiURL = `${environment.apiUrl}/academic/semesters`;

  constructor(private http: HttpClient) {}

  list(): Observable<ApiData<SemestersPayload>> {
    return this.http.get<ApiData<SemestersPayload>>(this.apiURL);
  }

  create(name: string, startDate: string, endDate: string): Observable<ApiData<SemestersPayload>> {
    return this.http.post<ApiData<SemestersPayload>>(this.apiURL, { name, start_date: startDate, end_date: endDate });
  }

  update(id: number, startDate: string, endDate: string): Observable<ApiData<SemestersPayload>> {
    return this.http.patch<ApiData<SemestersPayload>>(`${this.apiURL}/${id}`, { start_date: startDate, end_date: endDate });
  }

  enable(id: number): Observable<ApiData<SemestersPayload>> {
    return this.http.post<ApiData<SemestersPayload>>(`${this.apiURL}/${id}/enable`, {});
  }

  backToDraft(id: number): Observable<ApiData<SemestersPayload>> {
    return this.http.post<ApiData<SemestersPayload>>(`${this.apiURL}/${id}/draft`, {});
  }
}
