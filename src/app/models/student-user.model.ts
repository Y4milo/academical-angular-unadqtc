import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface StudentUser {
  id: string;
  payment_id: string;
  number: string;
  code: string;
  role: Dictionary;
}

