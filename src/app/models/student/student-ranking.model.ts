/**
 * Modelo que representa un los datos de un Student-Card.
 */
export interface StudentRaking {
  student: string,
  fullname: string;
  career: string;
  student_average: number;
  position_in_ranking: number;
  total_students: number;
  ranking_type: string;
  is_inside_ranking: boolean;
  limit: number;
}
