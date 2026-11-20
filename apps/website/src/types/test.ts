export type TestStatus = 'DRAFT' | 'SCHEDULED' | 'COMPLETED';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER';

export interface TestOptionSnapshot {
  id: string;
  position: number;
  optionText: string | null;
  optionImageUrl: string | null;
  latexContent?: string | null;
  isCorrect: boolean;
}

export type CorrectAnswerSnapshot =
  | { type: 'integer'; value: number | null }
  | { type: 'choice'; optionIds: string[] };

export interface TestQuestionDto {
  id: string;
  testId: string;
  originalQuestionId: string | null;
  questionText: string | null;
  questionImageUrl: string | null;
  latexContent: string | null;
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
  latexContent: string | null;
  type: QuestionType;
  integerAnswer: number | null;
  appearanceCount: number;
  options: TestOptionSnapshot[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type IntegrityIncidentType = 'TAB_HIDDEN' | 'PAGE_EXIT' | 'FOCUS_LOST' | 'SCREENSHOT_KEY';

export interface IntegrityIncidentDto {
  type: IntegrityIncidentType;
  at: string;
  // null: never came back on that device / a screenshot shortcut
  durationSeconds: number | null;
}

export interface IntegritySummaryDto {
  flagged: boolean;
  tabSwitches: number;
  pageExits: number;
  focusLosses: number;
  screenshotAttempts: number;
  timeAwaySeconds: number;
  incidents: IntegrityIncidentDto[];
}

export interface TestAnalyticsStudentDto {
  username: string;
  score: number;
  integrity: IntegritySummaryDto;
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
