import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';

export interface EventCertificateParticipant {
  id: number;
  person_id: number;
  number: string;
  full_name: string;
  email: string | null;
  participant_type: string | null;
  attendances: number;
  attendance_percentage: number;
  eligible: boolean;
}

export interface EventCertificateSummary {
  event: {
    id: number;
    title: string;
    slug: string;
    mode: string | null;
    status: string | null;
    url_banner: string | null;
    url_logo: string | null;
    attendance_percentage: number;
    certificate_criteria: string;
    dates: {
      id: number;
      date_time: string;
      mode: string;
      status: number;
    }[];
  };
  totals: {
    event_dates: number;
    required_attendances: number;
    event_required_attendances: number;
    participants: number;
    eligible: number;
    not_eligible: number;
  };
  eligible_participants: EventCertificateParticipant[];
  not_eligible_participants: EventCertificateParticipant[];
}

export interface EventCertificateZipJob {
  job_key: string;
  status: 'queued' | 'running' | 'ready' | 'failed';
  message?: string;
  processed?: number | null;
  total?: number | null;
  download_url?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventCertificateService {
  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  summary(requireEventPercentage = false): Observable<ApiData<EventCertificateSummary>> {
    return this.http.post<ApiData<EventCertificateSummary>>(
      `${this.apiURL}/event/admin/certificates/summary`,
      { require_event_percentage: requireEventPercentage }
    );
  }

  downloadZip(requireEventPercentage = false): Observable<Blob> {
    return this.http.post(
      `${this.apiURL}/event/admin/certificates/zip`,
      { require_event_percentage: requireEventPercentage },
      { responseType: 'blob' }
    );
  }

  prepareZip(requireEventPercentage = false): Observable<ApiData<EventCertificateZipJob>> {
    return this.http.post<ApiData<EventCertificateZipJob>>(
      `${this.apiURL}/event/admin/certificates/prepare`,
      { require_event_percentage: requireEventPercentage }
    );
  }

  zipStatus(jobKey: string): Observable<ApiData<EventCertificateZipJob>> {
    return this.http.get<ApiData<EventCertificateZipJob>>(
      `${this.apiURL}/event/admin/certificates/status/${jobKey}`
    );
  }

  downloadPreparedZip(jobKey: string): Observable<Blob> {
    return this.http.get(
      `${this.apiURL}/event/admin/certificates/download/${jobKey}`,
      { responseType: 'blob' }
    );
  }

  preview(requireEventPercentage = false): Observable<Blob> {
    return this.http.post(
      `${this.apiURL}/event/admin/certificates/preview`,
      { require_event_percentage: requireEventPercentage },
      { responseType: 'blob' }
    );
  }
}
