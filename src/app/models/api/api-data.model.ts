import {Payload} from './payload.model';

export interface ApiData<T> {
  payload  : Payload<T>;                  // Datos con metainformación
  time_exec : string;                           // Tiempo de ejecución (por ejemplo: "12ms")
}
