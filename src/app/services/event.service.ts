import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) { }

  getEventBasicDataBySlug(slug: string): Observable<ApiData<Event>> {
    return this.http.post<ApiData<Event>>(`${environment.apiUrl}/event/get-basic-data-by-slug`, {slug: slug});
  }
}
