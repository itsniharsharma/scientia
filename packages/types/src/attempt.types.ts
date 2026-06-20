import type { TestQuestionDto } from './test.types';

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';

export type SelectedAnswer =
  | { type: 'choice'; optionIds: string[] }
  | { type: 'integer'; value: number | null };

export interface ResponseDto {
  id: string;
  attemptId: string;
  testQuestionId: string;
  selectedAnswerJson: SelectedAnswer | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

export interface AttemptDto {
  id: string;
  studentId: string;
  testId: string;
  startedAt: string;
  submittedAt: string | null;
  status: AttemptStatus;
  score: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  unattemptedCount: number | null;
}

export interface AttemptTestMeta {
  id: string;
  name: string;
  durationMinutes: number;
  scheduledAt: string;
  questionCount: number;
}

export interface AttemptWithDetailsDto extends AttemptDto {
  test: AttemptTestMeta;
  questions: TestQuestionDto[];
  responses: ResponseDto[];
}

export interface SaveResponseInput {
  testQuestionId: string;
  selectedAnswerJson: SelectedAnswer | null;
}

export interface ScheduledTestDto {
  id: string;
  name: string;
  scheduledAt: string;
  durationMinutes: number;
  questionCount: number;
  attempted: boolean;
  attemptId: string | null;
  attemptStatus: AttemptStatus | null;
}

export interface AttemptSummaryDto extends AttemptDto {
  testName: string;
  questionCount: number;
}

export interface StudentDashboardDto {
  upcomingTests: ScheduledTestDto[];
  recentAttempts: AttemptSummaryDto[];
  stats: {
    totalAttempts: number;
    averageScore: number | null;
  };
}
