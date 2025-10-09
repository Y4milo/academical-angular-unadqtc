import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApiData} from '../models/api/api-data.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient) { }


}
