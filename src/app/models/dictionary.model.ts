/**
 * Modelo que representa un Campus (Sede).
 */
export interface Dictionary {
  id: number;
  entity?: string;
  value?: string;
  label: string;
  json?: Record<string, any>;
  is_current?: boolean;
  student_card_registration?: {
    can_register: boolean;
    start_date?: string | null;
    end_date?: string | null;
    message: string;
  };
}
