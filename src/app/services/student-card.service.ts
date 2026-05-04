import { Injectable } from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
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

  /**
   * ============================================
   * 🎓 STUDENT CARD SERVICES
   * ============================================
   * Servicios relacionados a la gestión del carné estudiantil
   * (subida de fotos, documentos y consulta de imágenes validadas)
   */
  uploadCardPhoto(studentCardData: FormData): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<any>>(
      `${this.apiURL}/student-cards/student/store/file/photo`,
      studentCardData
    );
  }

  uploadDniPhoto(studentDniData: FormData) {
    return this.http.post<ApiData<any>>(
      `${this.apiURL}/student-cards/student/store/file/dni`,
      studentDniData,
    );
  }

  // downloadLastValidatedStudentPhoto() {
  //   return this.http.get(
  //     '/api/student-cards/student/download/file/last-validated-photo?t=' + Date.now(),
  //     {
  //       responseType: 'blob',
  //       observe: 'response'
  //     }
  //   );
  // }
  downloadFile(type: 'photo' | 'dni') {
    return this.http.get(
      `/api/student-cards/student/download/file/${type}?t=${Date.now()}`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }

  /**
   * ============================================
   * 🎓 STUDENT CARD SERVICES - ACADEMIC (ADMIN)
   * ============================================
   * Servicios usados por el área académica para:
   * - Validación de fotos
   * - Gestión de estados (pending, validated, flagged)
   * - Exportación de archivos (PDF, Excel, ZIP)
   */
  // 📸 Actualizar foto
  updateStudentPhoto(formData: FormData): Observable<ApiData<StudentCard>> {
    return this.http.post<ApiData<StudentCard>>(
      `${this.apiURL}/student-cards/academic/set/update-photo`,
      formData
    );
  }

// 📋 LISTADOS

  getPendingStudentCards(): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/pending`
    );
  }

  getUnmatchedStudentCards(): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/unmatched`
    );
  }

  getValidatedStudentCards(): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/validated`
    );
  }

  getFlaggedStudentCards(): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/flagged`
    );
  }

// 🔄 CAMBIO DE ESTADO

  validateStudentCard(data: FormData): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}/student-cards/academic/set/validate-student`,
      data
    );
  }

  pendingStudentCard(data: FormData): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}/student-cards/academic/set/pending-student`,
      data
    );
  }

  setFlaggedStudentCard(data: any): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}/student-cards/academic/set/selected-flags`,
      data
    );
  }

// 📦 DESCARGAS

  downloadStudentPhotosZip(): Observable<Blob> {
    return this.http.get(
      `${this.apiURL}/student-cards/academic/download/zip`,
      { responseType: 'blob' }
    );
  }

  downloadStudentCardsExcel(): Observable<Blob> {
    return this.http.get(`${this.apiURL}/student-cards/academic/download/xlsx`, {
      responseType: 'blob'
    });
  }

  downloadStudentCardsPdf(): Observable<Blob> {
    return this.http.get(`${this.apiURL}/student-cards/academic/download/xlsx`, {
      responseType: 'blob'
    });
  }

  downloadStudentCardPhoto(formData: FormData): Observable<Blob> {
    return this.http.post(
      `${this.apiURL}/student-cards/academic/download/photo`,
      formData,
      { responseType: 'blob' }
    );
  }
}
