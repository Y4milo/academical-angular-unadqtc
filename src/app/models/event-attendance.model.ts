/**
 * Modelo que representa un los datos de un Student-Card.
 */
export interface EventAttendance {
  id: number;
  person_id: Person;
}

interface Person {
  id: number;
  number: number
  names: string;
  last_name: string;
  maternal_last_name: string;
}
