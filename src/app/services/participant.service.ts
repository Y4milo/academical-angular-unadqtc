import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';
import {FormGroup} from '@angular/forms';
import {Event} from '../models/events/event';
import {Person} from '../models/person.model';
import {Dictionary} from '../models/dictionary.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  storeParticipant(form: FormGroup): Observable<ApiData<Event>> {
    return this.http.post<ApiData<Event>>(`${environment.apiUrl}/participant/store`, form);
  }

  getParticipatedEvents(number: string):
  Observable<ApiData<{
    person: Person,
    events: { event: Event, participant_type: Dictionary }[]
  }>>
  {
    return this.http.get<ApiData<{
      person: Person,
      events: { event: Event, participant_type: Dictionary
      }[] }>>(`${environment.apiUrl}/event/participant/participated-events/${number}`);
  }
}
