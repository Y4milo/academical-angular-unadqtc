import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface Staff {
  id: string;
  nick: string;
  password: string;
  position: string;
  role_id: Dictionary;
  dependency_id: Dictionary;
  person_id: Dictionary;

}
