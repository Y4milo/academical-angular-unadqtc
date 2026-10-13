import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface Attendance {
  punch_time: string;     // Fecha y hora en formato dd/MM/yyyy HH:mm:ss
  verify_type: string;    // Tipo de verificación (fingerprint, face, card, etc.)
  campus: string;         // Nombre del campus (por ejemplo: "Huayruropata")
  is_manual?: boolean;                        // registrada a mano (lector de barras o DNI digitado), no por el reloj
  day_role?: 'entry' | 'lunch_out' | 'lunch_in' | 'exit' | 'extra';  // qué fue dentro del día, deducido por hora y orden (extra = repetida)
  source?: 'clock' | 'barcode' | 'keyboard';  // reloj biométrico, lector de barras o DNI digitado
  punch_kind?: 'entry' | 'exit' | 'outside' | null;
  punch_status?: string | null;
  punch_label?: string | null;                // qué marcación fue según el horario (solo las manuales)
  reason?: string | null;                     // motivo del registro manual (solo admin y RRHH)
  registered_by?: string | null;              // quién lo registró (solo admin y RRHH)
}

