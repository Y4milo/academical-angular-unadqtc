/**
 * Modelo que representa un Event Question.
 */
export interface EventQuestion {
  id: number;
  question_schema: {
    question: string,
    open_ended: true,
    multiple_choice: false,
    difficulty: "easy" | "medium" | "difficult",
    options: { text: string, is_correct: boolean }[]
  };
}
