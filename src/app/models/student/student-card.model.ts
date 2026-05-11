import {Dictionary} from '../dictionary.model';

/**
 * Modelo que representa un los datos de un Student-Card.
 */
export interface StudentCardFlag {
  id?: number;
  value?: string;
  label?: string;
  name?: string;
  code?: string;
}

export interface StudentCardFileStatus {
  id?: number;
  value?: string;
  label?: string;
}

export interface StudentCardFile {
  id: number;
  path: string;
  name?: string;
  mime_type?: string;
  status?: StudentCardFileStatus;
}

export interface StudentCard {
  id: number;
  id_student: string,
  number?: string,
  code: string;
  names?: string;
  father_last_name?: string;
  mother_last_name?: string;
  email?: string;
  address?: string;
  check_digit?: number;
  id_type?: Dictionary | null;
  gender?: Dictionary | null;
  campus?: Dictionary | null;
  fullName: string;
  cellphone: string;
  semester: string;
  photo_path: string;
  photo_name: string;
  photo?: StudentCardFile | null;
  dni?: StudentCardFile | null;
  list_flags: StudentCardFlag[];
  status: { id: number; value: string };
}
