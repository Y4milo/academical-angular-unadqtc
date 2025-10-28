import {Dictionary} from './dictionary.model';
import {LoginPerson} from './login-person.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface User {
  id: string;
  nick: string;
  position: string;
  role: Dictionary;
  staff: Staff;
  dependency: Dictionary;
  status_relation: Dictionary;
}

export interface Staff {
  id: string;
  number: string,
  names: string
}
