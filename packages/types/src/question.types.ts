export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER';
export type QuestionStatus = 'DRAFT' | 'PUBLISHED';

export interface QuestionOption {
  id: string;
  questionId: string;
  position: number;
  optionText: string | null;
  optionImageUrl: string | null;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  topicId: string;
  type: QuestionType;
  status: QuestionStatus;
  questionText: string | null;
  questionImageUrl: string | null;
  integerAnswer: number | null;
  options: QuestionOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOptionDto {
  position: number;
  optionText?: string;
  optionImageUrl?: string;
  isCorrect: boolean;
}

export interface CreateQuestionDto {
  type: QuestionType;
  questionText?: string;
  questionImageUrl?: string;
  options?: CreateOptionDto[];
  integerAnswer?: number;
}

export interface UpdateOptionDto {
  position: number;
  optionText?: string;
  optionImageUrl?: string;
  isCorrect: boolean;
}

export interface UpdateQuestionDto {
  questionText?: string | null;
  questionImageUrl?: string | null;
  options?: UpdateOptionDto[];
  integerAnswer?: number | null;
}
