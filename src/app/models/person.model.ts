import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface Person {
  id: string;
  number: string;
  full_name: string;
  names: string;
  last_name: string;
  maternal_last_name: string;
  email: string;
  phone: string;
}
