import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface StaffUser {
  id: string;
  nick: string;
  position: Dictionary;
  role: Dictionary;
  /** Lo que la persona puede hacer (suma de sus perfiles). Las sesiones iniciadas antes de que existiera no lo traen: ahí se usa el rol. */
  permissions?: string[];
  staff: Staff;
  dependency: Dictionary;
  status_relation: Dictionary;
}

export interface Staff {
  id: string;
  number: string,
  names: string
}
