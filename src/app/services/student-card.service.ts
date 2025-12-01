import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {environment} from '../../environments/environment';
import {Dictionary} from '../models/dictionary.model';
import {StudentCard} from '../models/student/student-card.model';

@Injectable({
  providedIn: 'root'
})
export class StudentCardService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  uploadCardPhoto(studentCardData: any): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<any>>(`${this.apiURL}/student-cards/store`, studentCardData);
  }
  updateStudentPhoto(formData: FormData):Observable<ApiData<StudentCard>> {
    return this.http.post<ApiData<StudentCard>>(`${this.apiURL}/student-cards/update-photo`, formData);
  }
  getPendingStudentCards() :Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(`${environment.apiUrl}/student-cards/pending`);
  }
  getUnmatchedStudentCards() :Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(`${environment.apiUrl}/student-cards/unmatched`);
  }
  getValidatedStudentCards() :Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(`${environment.apiUrl}/student-cards/validated`);
  }
  getFlaggedStudentCards() :Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(`${environment.apiUrl}/student-cards/flagged`);
  }
  validateStudentCard(statusStudentCard: FormData) :Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(`${environment.apiUrl}/student-cards/validate-student`, statusStudentCard);
  }
  pendingStudentCard(statusStudentCard: FormData) :Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(`${environment.apiUrl}/student-cards/pending-student`, statusStudentCard);
  }
  setFlaggedStudentCard(selectedFlags: any) :Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(`${environment.apiUrl}/student-cards/set-selected-flags`, selectedFlags);
  }
  downloadStudentCardsPDF(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/student-cards/pdf`, {
      responseType: 'blob'  // 👈 No uses 'as json', ni <Blob>
    }) as Observable<Blob>;  // 👈 Esto es lo correcto
  }
  downloadStudentCardsExcel(): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/student-cards/xlsx`, {
      responseType: 'blob'  // 👈 No uses 'as json', ni <Blob>
    }) as Observable<Blob>;  // 👈 Esto es lo correcto
  }
  downloadStudentPhotosZip(): Observable<Blob|ApiData<any>> {
    return this.http.get(`${environment.apiUrl}/student-cards/zip`, {
      responseType: 'blob',
    });
  }
  downloadStudentCardPhoto(idStudentCard: FormData): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/student-cards/download-student-card-photo`, idStudentCard, {
      responseType: 'blob'
    });
  }
}
