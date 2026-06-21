import { api } from './axios';
import type {
  TestDto,
  TestWithQuestionsDto,
  TestQuestionDto,
  TestOptionSnapshot,
  SubjectOption,
  ChapterOption,
  TopicOption,
  ReplacementPoolQuestion,
  TestAnalyticsDto,
} from '../types/test';

// ─── Test Bank Endpoints (existing, no auth required) ────────────────────────

export async function fetchSubjects(): Promise<SubjectOption[]> {
  const res = await api.get<SubjectOption[]>('/subjects');
  return res.data;
}

export async function fetchChaptersBySubject(subjectId: string): Promise<ChapterOption[]> {
  const res = await api.get<ChapterOption[]>(`/subjects/${subjectId}/chapters`);
  return res.data;
}

export async function fetchTopicsByChapter(chapterId: string): Promise<TopicOption[]> {
  const res = await api.get<TopicOption[]>(`/chapters/${chapterId}/topics`);
  return res.data;
}

// ─── Test Generation ─────────────────────────────────────────────────────────

export async function generateTest(data: {
  name: string;
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  durationMinutes: number;
  scheduledAt: string;
  batchId?: string;
}): Promise<TestWithQuestionsDto> {
  const res = await api.post<TestWithQuestionsDto>('/tests/generate', data);
  return res.data;
}

// ─── Test CRUD ───────────────────────────────────────────────────────────────

export async function listTests(): Promise<TestDto[]> {
  const res = await api.get<TestDto[]>('/tests');
  return res.data;
}

export async function getTest(testId: string): Promise<TestWithQuestionsDto> {
  const res = await api.get<TestWithQuestionsDto>(`/tests/${testId}`);
  return res.data;
}

export async function updateTest(
  testId: string,
  data: { name?: string; scheduledAt?: string; status?: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' },
): Promise<TestDto> {
  const res = await api.patch<TestDto>(`/tests/${testId}`, data);
  return res.data;
}

export async function deleteTest(testId: string): Promise<void> {
  await api.delete(`/tests/${testId}`);
}

// ─── TestQuestion Operations ──────────────────────────────────────────────────

export async function updateTestQuestion(
  testId: string,
  questionId: string,
  data: { questionText?: string; questionImageUrl?: string | null; optionsJson?: TestOptionSnapshot[]; position?: number },
): Promise<TestQuestionDto> {
  const res = await api.patch<TestQuestionDto>(`/tests/${testId}/questions/${questionId}`, data);
  return res.data;
}

export async function deleteTestQuestion(testId: string, questionId: string): Promise<void> {
  await api.delete(`/tests/${testId}/questions/${questionId}`);
}

export async function addReplacementQuestion(
  testId: string,
  data: { originalQuestionId: string; position: number },
): Promise<TestQuestionDto> {
  const res = await api.post<TestQuestionDto>(`/tests/${testId}/questions/replacement`, data);
  return res.data;
}

export async function reorderTestQuestions(
  testId: string,
  order: { id: string; position: number }[],
): Promise<void> {
  await api.patch(`/tests/${testId}/questions/reorder`, { order });
}

export async function getReplacementPool(testId: string): Promise<ReplacementPoolQuestion[]> {
  const res = await api.get<ReplacementPoolQuestion[]>(`/tests/${testId}/replacement-pool`);
  return res.data;
}

export async function getTestAnalytics(testId: string): Promise<TestAnalyticsDto> {
  const res = await api.get<TestAnalyticsDto>(`/tests/${testId}/analytics`);
  return res.data;
}
