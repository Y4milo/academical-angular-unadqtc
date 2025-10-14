import {Dictionary} from './dictionary.model';
import {LoginPerson} from './login-person.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface LoginUser {
  id: string;
  nick: string;
  position: string;
  role_id: Dictionary;
  dependency_id: Dictionary;
  person_id: LoginPerson;
}
