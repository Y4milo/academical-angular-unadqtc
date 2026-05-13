/**
 * Modelo que representa un Campus (Sede).
 */
export interface Dictionary {
  id: number;
  entity?: string;
  value?: string;
  label: string;
  json?: Record<string, any>;
  student_card_registration?: {
    can_register: boolean;
    start_date?: string | null;
    end_date?: string | null;
    message: string;
  };
}
