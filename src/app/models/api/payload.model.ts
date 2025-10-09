/**
 * Modelo que representa el modelo Payload.
 */
export interface Payload<T> {
  status    : 'success' | 'warning' | 'error';  // "success", "error", etc.
  message   : string;
  title     : string;
  data      : T;
  log       : T;
}
