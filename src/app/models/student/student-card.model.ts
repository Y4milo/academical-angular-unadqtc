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

export interface StudentCard {
  id: number;
  id_student: string,
  code: string;
  campus: string;
  full_name: string;
  cellphone: string;
  semester: string;
  photo_path: string;
  photo_name: string;
  list_flags: StudentCardFlag[];
  status: { id: number; value: string };
}
