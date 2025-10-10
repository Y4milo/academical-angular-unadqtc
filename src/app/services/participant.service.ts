import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {ApiDataEncoded} from '../models/api/api-data-encoded.model';
import {StudentBasicInfo} from '../models/student-basic-info.model';
import {FormGroup} from '@angular/forms';
import {Dictionary} from '../models/dictionary.model';
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
