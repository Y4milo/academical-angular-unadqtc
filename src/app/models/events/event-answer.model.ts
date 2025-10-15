/**
 * Modelo que representa un Campus (Sede).
 */
export interface EventAnswer {
  id: number;
  answer_schema: AnswerSelection[];
}

interface AnswerSelection {
  key: number; // Key de la opción seleccionada
}
