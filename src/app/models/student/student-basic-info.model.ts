import {Dictionary} from '../dictionary.model';

/**
 * Interface que representa los datos del formulario de registro de carné universitario.
 */
export interface StudentBasicInfo {
  id?: number;                  // ID del estudiante
  id_type?: Dictionary;             // ID del tipo de documento
  code?: string;        // Código del estudiante (máx. 15 caracteres)
  number?: string;          // DNI / Carné del estudiante (máx. 20 caracteres)
  check_digit?: number;         // Dígito verificador del DNI
  names?: string;               // Nombres del estudiante
  father_last_name?: string;    // Apellido paterno
  mother_last_name?: string;    // Apellido materno
  email?: string;               // Correo electrónico
  cellphone?: string;           // Celular
  address?: string;             // Dirección
  campus?: Dictionary;              // ID de la sede
}


