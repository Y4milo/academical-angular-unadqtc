import {Payload} from './payload.model';

/**
 * Modelo que representa el modelo FieldDecoded.
 */
export interface PayloadDecoded<P> {
  status    : 'success' | 'warning' | 'error';
  title     : string;
  message   : string;
  payload?  : Payload<P>;
}
