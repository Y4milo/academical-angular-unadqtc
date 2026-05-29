import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiData } from '../models/api/api-data.model';
import { ApprovedAveragePreview } from '../models/student/approved-average-preview.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovedAverageService {
  private readonly legacyBaseUrl = 'https://bellasartescusco.edu.pe/ccomputo/administrador/api/averages';
  private readonly legacyHeaders = new HttpHeaders({
    'x-api-key': 'API_KEY_9f2b8c1e6d7a44c0b3f1e0ad78c9f2e1_!XK$72mPq9#LdA4'
  });

  constructor(private http: HttpClient) { }

  preview(file: File, campus = ''): Observable<ApiData<ApprovedAveragePreview>> {
    const formData = this.buildFormData(file);
    return this.http.post<ApiData<ApprovedAveragePreview>>(
      `${this.legacyBaseUrl}/previewApprovedAverage.php${this.campusQuery(campus)}`,
      formData,
      {
        headers: this.legacyHeaders,
        withCredentials: true
      }
    );
  }

  export(file: File, campus = ''): Observable<HttpResponse<Blob>> {
    const formData = this.buildFormData(file);
    return this.http.post(
      `${this.legacyBaseUrl}/exportApprovedAverage.php${this.campusQuery(campus)}`,
      formData,
      {
        headers: this.legacyHeaders,
        responseType: 'blob',
        observe: 'response',
        withCredentials: true
      }
    );
  }

  private buildFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  }

  private campusQuery(campus: string): string {
    return campus ? `?campus=${encodeURIComponent(campus)}` : '';
  }
}
