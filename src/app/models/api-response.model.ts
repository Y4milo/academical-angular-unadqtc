import {DataResponse} from './data-response.model';

export interface ApiResponse<T> {
  status    : 'success' | 'warning' | 'error';  // "success", "error", etc.
  response  : DataResponse<T>;                  // Datos con metainformación
  time_exec : string;                           // Tiempo de ejecución (por ejemplo: "12ms")
}
