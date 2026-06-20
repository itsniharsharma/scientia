import { api } from './axios';
import type {
  AttemptWithDetailsDto,
  AttemptDto,
  ResponseDto,
  SelectedAnswer,
  ScheduledTestDto,
  StudentDashboardDto,
  AttemptReviewDto,
} from '../types/attempt';

export async function startAttempt(testId: string): Promise<AttemptWithDetailsDto> {
  const res = await api.post<AttemptWithDetailsDto>('/attempts', { testId });
  return res.data;
}

export async function getAttempt(attemptId: string): Promise<AttemptWithDetailsDto> {
  const res = await api.get<AttemptWithDetailsDto>(`/attempts/${attemptId}`);
  return res.data;
}

export async function saveResponses(
  attemptId: string,
  responses: { testQuestionId: string; selectedAnswerJson: SelectedAnswer | null }[],
): Promise<ResponseDto[]> {
  const res = await api.put<ResponseDto[]>(`/attempts/${attemptId}/responses`, { responses });
  return res.data;
}

export async function submitAttempt(attemptId: string): Promise<AttemptDto> {
  const res = await api.post<AttemptDto>(`/attempts/${attemptId}/submit`);
  return res.data;
}

export async function listScheduledTests(): Promise<ScheduledTestDto[]> {
  const res = await api.get<ScheduledTestDto[]>('/student/tests');
  return res.data;
}

export async function getStudentDashboard(): Promise<StudentDashboardDto> {
  const res = await api.get<StudentDashboardDto>('/student/dashboard');
  return res.data;
}

export async function getAttemptReview(attemptId: string): Promise<AttemptReviewDto> {
  const res = await api.get<AttemptReviewDto>(`/attempts/${attemptId}/review`);
  return res.data;
}
