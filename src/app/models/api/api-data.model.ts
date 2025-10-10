import {Payload} from './payload.model';

export interface ApiData<T> {
  status    : 'success' | 'warning' | 'error' | 'info'; // "success", "error", etc.
  encoded   : true | false;
  decoded   : true | false;
  payload   : Payload<T>;                  // Datos con meta-información
}
