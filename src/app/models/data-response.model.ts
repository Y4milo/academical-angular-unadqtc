/**
 * Modelo que representa el modelo Error.
 */
export interface DataResponse<T> {
  message : string;
  title   : string;
  decoded : boolean;
  payload : T;
}
