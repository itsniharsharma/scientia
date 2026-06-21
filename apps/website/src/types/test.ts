export type TestStatus = 'DRAFT' | 'SCHEDULED' | 'COMPLETED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER';

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
  questionType: QuestionType;
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
  batchId: string | null;
  batchName: string | null;
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

// Subject / Chapter / Topic shapes returned by existing bank endpoints
export interface SubjectOption {
  id: string;
  name: string;
}

export interface ChapterOption {
  id: string;
  name: string;
  subjectId: string;
}

export interface TopicOption {
  id: string;
  name: string;
  chapterId: string;
}

export interface ReplacementPoolQuestion {
  id: string;
  questionText: string | null;
  questionImageUrl: string | null;
  type: QuestionType;
  integerAnswer: number | null;
  appearanceCount: number;
  options: TestOptionSnapshot[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TestAnalyticsStudentDto {
  username: string;
  score: number;
}

export interface TestAnalyticsDto {
  test: { id: string; name: string };
  summary: {
    highestScore: number | null;
    lowestScore: number | null;
    averageScore: number | null;
  };
  students: TestAnalyticsStudentDto[];
}
