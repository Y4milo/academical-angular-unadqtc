/**
 * Modelo que representa un los datos de un Student-Card.
 */
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
  list_flags: { name: string; code: string }[];
  status: { id: number; value: string };
}
