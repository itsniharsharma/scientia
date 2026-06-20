export type TestStatus = 'DRAFT' | 'SCHEDULED' | 'COMPLETED';

export interface TestOptionSnapshot {
  id: string;
  position: number;
  optionText: string | null;
  optionImageUrl: string | null;
  isCorrect: boolean;
}

export type CorrectAnswerSnapshot =
  | { type: 'integer'; value: number | null }
  | { type: 'choice'; optionIds: string[] };

export interface TestQuestionDto {
  id: string;
  testId: string;
  originalQuestionId: string;
  questionText: string | null;
  questionImageUrl: string | null;
  questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER';
  optionsJson: TestOptionSnapshot[];
  correctAnswerJson: CorrectAnswerSnapshot;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestDto {
  id: string;
  name: string;
  teacherId: string;
  subjectId: string;
  durationMinutes: number;
  scheduledAt: string;
  status: TestStatus;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestWithQuestionsDto extends TestDto {
  questions: TestQuestionDto[];
}
