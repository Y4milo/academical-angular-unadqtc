/**
 * Interface que representa los datos del formulario de registro de carné universitario.
 */
export interface StudentBasicInfo {
  id: number;                  // ID del estudiante
  id_type: number;             // ID del tipo de documento
  code_student: string;        // Código del estudiante (máx. 15 caracteres)
  id_student: string;          // DNI / Carné del estudiante (máx. 20 caracteres)
  check_digit: number;         // Dígito verificador del DNI
  names: string;               // Nombres del estudiante
  father_last_name: string;    // Apellido paterno
  mother_last_name: string;    // Apellido materno
  email: string;               // Correo electrónico
  cellphone: string;           // Celular
  address: string;             // Dirección
  campus: number;              // ID de la sede
}
