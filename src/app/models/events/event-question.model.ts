/**
 * Modelo que representa un Event Question.
 */
export interface EventQuestion {

  id: number;
  question_schema: {
    question: string,
    open_ended: boolean,
    multiple_choice: boolean,
    difficulty: "easy" | "medium" | "difficult",
    options: QuestionOption[],
  };
  answer?: string;
  invalid?: boolean;
}

export interface QuestionOption {
  text: string; // indica la etiqueta que se mostrara en la opción
  selected?: boolean;
  is_correct: boolean;// indica si la respuesta es correcta o no
}

export interface UserAnswer {
  questionId: number;
  answer: string | string[]; // texto o lista de opciones
}

