import {Dictionary} from './dictionary.model';

/**
 * Modelo que representa un los datos de un usuario.
 */
export interface Attendance {
  punch_time: string;     // Fecha y hora en formato dd/MM/yyyy HH:mm:ss
  verify_type: string;    // Tipo de verificación (fingerprint, face, card, etc.)
  campus: string;         // Nombre del campus (por ejemplo: "Huayruropata")
}

