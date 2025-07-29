/**
 * Modelo que representa un los datos de un usuario.
 */
export interface UserLogin {
  id: string;
  code: string;
  name: string;
  password: boolean;
  user_type_label: string;
  user_type_value: string;
}
