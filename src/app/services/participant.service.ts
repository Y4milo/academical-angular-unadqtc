import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {FormGroup} from '@angular/forms';
import {ParticipantResponse} from '../models/participant-response.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  storeParticipant(form: FormGroup): Observable<ApiData<ParticipantResponse>> {
    return this.http.post<ApiData<ParticipantResponse>>(`${environment.apiUrl}/participant/store`, form);
  }
}
