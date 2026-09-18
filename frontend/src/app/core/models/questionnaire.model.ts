export interface QuestionBase {
  id: string;
  prompt: string;
  type: 'text' | 'checkbox' | 'select';
}

export interface SelectQuestion extends QuestionBase {
  type: 'select';
  options: string[];
}

export type Question = QuestionBase | SelectQuestion;

export interface Questionnaire {
  QuestionnaireId: number;
  Title: string;
  Description: string | null;
  QuestionsJson: string;
}

export interface QuestionnaireResponse {
  ResponseId: number;
  QuestionnaireId: number;
  PatientId: number;
  ReferralId: number | null;
  SubmittedAt: string;
  AnswersJson: string;
}
