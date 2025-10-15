/**
 * Modelo que representa el modelo Payload.
 */
export interface Payload<T> {
  iat       : number;
  exp       : number;
  message   : string;
  title     : string;
  data      : T;
  log       : T;
  error     : string;
  errors?: Record<string, string[]>;
}
