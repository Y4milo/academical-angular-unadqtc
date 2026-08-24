import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {environment} from '../../environments/environment';
import {Dictionary} from '../models/dictionary.model';
import {StudentCard} from '../models/student/student-card.model';
import {API_STUDENT_CARDS, StudentFileType} from '../core/constants/api/student-card-api.constants';
import {StudentBasicInfo} from '../models/student/student-basic-info.model';

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

  downloadFile(type: StudentFileType) {

    return this.http.get(
      `${this.apiURL}${API_STUDENT_CARDS.STUDENT.DOWNLOAD.FILE(type)}?t=${Date.now()}`,
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
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.UPDATE.STUDENT.FILE.PHOTO}`,
      formData
    );
  }

  updateAcademicStudentFile(type: StudentFileType, formData: FormData): Observable<ApiData<StudentCard>> {
    return this.http.post<ApiData<StudentCard>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.UPDATE.STUDENT.FILE.BY_TYPE(type)}`,
      formData
    );
  }

  updateAcademicStudentBasicInfo(studentData: StudentBasicInfo & { id: number }): Observable<ApiData<StudentCard>> {
    return this.http.put<ApiData<StudentCard>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.UPDATE.STUDENT.BASIC_INFO}`,
      studentData
    );
  }

// 📋 LISTADOS

  private semesterParams(semesterId?: number): {params?: HttpParams} {
    return semesterId ? {params: new HttpParams().set('semester_id', semesterId)} : {};
  }

  listPendingStudentCards(semesterId?: number): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/student/pending`,
      this.semesterParams(semesterId)
    );
  }

  listUnmatchedStudentCards(semesterId?: number): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/student/unmatched`,
      this.semesterParams(semesterId)
    );
  }

  listValidatedStudentCards(semesterId?: number): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/student/validated`,
      this.semesterParams(semesterId)
    );
  }

  listFlaggedStudentCards(semesterId?: number): Observable<ApiData<StudentCard[]>> {
    return this.http.get<ApiData<StudentCard[]>>(
      `${this.apiURL}/student-cards/academic/list/student/flagged`,
      this.semesterParams(semesterId)
    );
  }

// 🔄 CAMBIO DE ESTADO

  validateStudentCard(data: FormData): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.SET.STUDENT.VALIDATE}`,
      data
    );
  }

  pendingStudentCard(data: FormData): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.SET.STUDENT.PENDING}`,
      data
    );
  }

  setFlaggedStudentCard(data: any): Observable<ApiData<Dictionary>> {
    return this.http.post<ApiData<Dictionary>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.SET.STUDENT.FLAGS}`,
      data
    );
  }

  setStudentFileStatus(data: {
    id: number;
    type: StudentFileType;
    status: 'approved' | 'rejected' | 'pending';
    flags?: any[];
  }): Observable<ApiData<any>> {
    return this.http.post<ApiData<any>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.SET.STUDENT.FILE_STATUS}`,
      data
    );
  }

// 📦 DESCARGAS

  storeManualRegistration(data: FormData): Observable<ApiData<StudentCard>> {
    return this.http.post<ApiData<StudentCard>>(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.SET.STUDENT.MANUAL_REGISTRATION}`,
      data
    );
  }

  downloadStudentPhotosZip(semesterId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.DOWNLOAD.STUDENT.FILE.ZIP}`,
      {params: new HttpParams().set('semester_id', semesterId), responseType: 'blob'}
    );
  }

  downloadStudentCardsExcel(semesterId: number): Observable<Blob> {
    return this.http.get(`${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.DOWNLOAD.STUDENT.FILE.XLSX}`, {
      params: new HttpParams().set('semester_id', semesterId),
      responseType: 'blob'
    });
  }

  downloadStudentCardsPdf(semesterId: number): Observable<Blob> {
    return this.http.get(`${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.DOWNLOAD.STUDENT.FILE.PDF}`, {
      params: new HttpParams().set('semester_id', semesterId),
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

  downloadAcademicStudentFile(studentCardId: number, type: StudentFileType): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiURL}${API_STUDENT_CARDS.ACADEMIC.DOWNLOAD.STUDENT.FILE_BY_TYPE(studentCardId, type)}?t=${Date.now()}`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    );
  }
}
