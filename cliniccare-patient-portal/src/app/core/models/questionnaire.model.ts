export type QuestionType = 'text' | 'choice';

export interface Question {
  QuestionId: number;
  QuestionText: string;
  Type: QuestionType;
  Choices: string[] | null;
  ExistingAnswer: string | null;
}

export interface QuestionnaireSummary {
  QuestionnaireId: number;
  PatientId: number;
  ReferralId: number | null;
  Title: string;
  Status: string;
}

export interface QuestionnaireDetail extends QuestionnaireSummary {
  questions: Question[];
}

export interface AnswerSubmit {
  question_id: number;
  answer: string;
}
