import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiData } from '../models/api/api-data.model';
import { PhotoReviewThresholds } from '../core/utils/photo-review.util';

export interface CardFlowStudent {
  code: string | null;
  number: string | null;
  check_digit: string | null;
  names: string | null;
  father_last_name: string | null;
  mother_last_name: string | null;
  email: string | null;
  cellphone: string | null;
  address: string | null;
  birthdate: string | null;
  id_type: string | null;
  gender: string | null;
  campus: string | null;
}

export interface CardFlowFileState {
  required: boolean;
  has_previous: boolean;
  uploaded_now: boolean;
  attempts_left: number;
}

/** Estado del carné del estudiante en el semestre vigente (`GET /students/card`). */
export interface CardFlowState {
  semester: { id: number; name: string };
  availability: { can_register: boolean; start_date: string | null; end_date: string | null; message: string; enabled: boolean };
  rules: {
    max_attempts: number; photo_min_kb: number; photo_max_kb: number; photo_width: number; photo_height: number;
    /** Umbrales de la revisión previa de la foto de este semestre. */
    photo_review: PhotoReviewThresholds;
  };
  student: CardFlowStudent;
  photo: CardFlowFileState & { previous_semester: string | null };
  dni: CardFlowFileState;
  card: { status: string | null; submitted: boolean };
  payment_required: boolean;
}

export interface CardContactInput {
  email: string;
  cellphone: string;
  address: string;
  birthdate: string;
}

export interface CardSubmitResult {
  status: 'validated' | 'pending';
  auto_validated: boolean;
}

/** Carné universitario del estudiante: estado del flujo, datos de contacto y envío. */
@Injectable({ providedIn: 'root' })
export class StudentCardFlowService {
  private readonly apiURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  state(): Observable<ApiData<CardFlowState>> {
    return this.http.get<ApiData<CardFlowState>>(`${this.apiURL}/students/card`);
  }

  saveContact(input: CardContactInput): Observable<ApiData<{ id: number }>> {
    return this.http.put<ApiData<{ id: number }>>(`${this.apiURL}/students/update/basic-info`, input);
  }

  submit(): Observable<ApiData<CardSubmitResult>> {
    return this.http.post<ApiData<CardSubmitResult>>(`${this.apiURL}/students/card/submit`, {});
  }
}
