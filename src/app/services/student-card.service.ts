import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiResponse} from '../models/api-response.model';
import {environment} from '../../environments/environment';
import {Dictionary} from '../models/dictionary.model';
import {StudentCard} from '../models/student-card.model';

@Injectable({
  providedIn: 'root'
})
export class StudentCardService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  uploadCardPhoto(studentCardData: any): Observable<ApiResponse<Dictionary>> {
    return this.http.post<ApiResponse<any>>(`${this.apiURL}/student-cards/store`, studentCardData);
  }
  getPendingStudentCards() :Observable<ApiResponse<StudentCard[]>> {
    return this.http.get<ApiResponse<StudentCard[]>>(`${environment.apiUrl}/student-cards/pending`);
  }
  getUnmatchedStudentCards() :Observable<ApiResponse<StudentCard[]>> {
    return this.http.get<ApiResponse<StudentCard[]>>(`${environment.apiUrl}/student-cards/unmatched`);
  }
  getValidatedStudentCards() :Observable<ApiResponse<StudentCard[]>> {
    return this.http.get<ApiResponse<StudentCard[]>>(`${environment.apiUrl}/student-cards/validated`);
  }
  getFlaggedStudentCards() :Observable<ApiResponse<StudentCard[]>> {
    return this.http.get<ApiResponse<StudentCard[]>>(`${environment.apiUrl}/student-cards/flagged`);
  }
  validateStudentCard(statusStudentCard: FormData) :Observable<ApiResponse<Dictionary>> {
    return this.http.post<ApiResponse<Dictionary>>(`${environment.apiUrl}/student-cards/validate-student`, statusStudentCard);
  }
  pendingStudentCard(statusStudentCard: FormData) :Observable<ApiResponse<Dictionary>> {
    return this.http.post<ApiResponse<Dictionary>>(`${environment.apiUrl}/student-cards/pending-student`, statusStudentCard);
  }
  setFlaggedStudentCard(selectedFlags: FormData) :Observable<ApiResponse<Dictionary>> {
    return this.http.post<ApiResponse<Dictionary>>(`${environment.apiUrl}/student-cards/set-selected-flags`, selectedFlags);
  }
  downloadStudentCardsPDF(): Observable<Blob|ApiResponse<any>> {
    return this.http.get(`${environment.apiUrl}/student-cards/pdf`, {
      responseType: 'blob'  // 👈 No uses 'as json', ni <Blob>
    }) as Observable<Blob>;  // 👈 Esto es lo correcto
  }
  downloadStudentPhotosZip(): Observable<Blob|ApiResponse<any>> {
    return this.http.get(`${environment.apiUrl}/student-cards/zip`, {
      responseType: 'blob',
    });
  }
  downloadStudentCardsPhoto(idStudentCard: FormData): Observable<Blob|ApiResponse<any>> {
    return this.http.post(`${environment.apiUrl}/student-cards/download-student-card-photo`, idStudentCard, {
      responseType: 'blob'
    });
  }
}
