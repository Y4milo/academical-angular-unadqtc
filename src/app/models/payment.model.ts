/**
 * Modelo que representa un Pago.
 */
export interface Payment {
  id: number;
  bank_id: number,
  code_student: string,
  password: string,
  payment_id: number,
  semester_id: number,
  user_type_label: string;
  user_type_value: string;
}
