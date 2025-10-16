import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {EventAttendance} from '../models/event-attendance.model';
import {EventQuestion} from '../models/events/event-question.model';

@Injectable({
  providedIn: 'root'
})
export class EventQuestionAnswerService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  confirmParticipant(formData: FormData): Observable<ApiData<number>> {
    return this.http.post<ApiData<number>>(`${this.apiURL}/event/confirm-participant`, formData);
  }

  listQuestionsByEventDate(formData: FormData): Observable<ApiData<EventQuestion[]>> {
    return this.http.post<ApiData<EventQuestion[]>>(`${this.apiURL}/event/question/list`, formData);
  }

  storeAnswerEvent(formData: FormData): Observable<ApiData<string>> {
    return this.http.post<ApiData<string>>(`${this.apiURL}/event/answers/store`, formData);
  }

  storeAnswerEvent(formData: FormData): Observable<ApiData<EventQuestion[]>> {
    return this.http.post<ApiData<EventQuestion[]>>(`${this.apiURL}/event/answers/store`, formData);
  }
}
