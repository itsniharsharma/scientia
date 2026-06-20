import type {
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  Chapter,
  CreateChapterDto,
  UpdateChapterDto,
  Topic,
  CreateTopicDto,
  UpdateTopicDto,
  Question,
  CreateQuestionDto,
  UpdateQuestionDto,
} from '@scientia/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => ({ error: 'Unknown error' }));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body as { error?: string }).error ?? 'Request failed',
      (body as { details?: { field: string; message: string }[] }).details,
    );
  }

  return body as T;
}

export const subjectsApi = {
  list: (): Promise<Subject[]> => request<Subject[]>('/subjects'),

  getById: (id: string): Promise<Subject> =>
    request<Subject>(`/subjects/${id}`),

  create: (data: CreateSubjectDto): Promise<Subject> =>
    request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSubjectDto): Promise<Subject> =>
    request<Subject>(`/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    request<void>(`/subjects/${id}`, { method: 'DELETE' }),
};

export const chaptersApi = {
  list: (subjectId: string): Promise<Chapter[]> =>
    request<Chapter[]>(`/subjects/${subjectId}/chapters`),

  getById: (id: string): Promise<Chapter> =>
    request<Chapter>(`/chapters/${id}`),

  create: (subjectId: string, data: CreateChapterDto): Promise<Chapter> =>
    request<Chapter>(`/subjects/${subjectId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateChapterDto): Promise<Chapter> =>
    request<Chapter>(`/chapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    request<void>(`/chapters/${id}`, { method: 'DELETE' }),
};

export const topicsApi = {
  list: (chapterId: string): Promise<Topic[]> =>
    request<Topic[]>(`/chapters/${chapterId}/topics`),

  getById: (id: string): Promise<Topic> =>
    request<Topic>(`/topics/${id}`),

  create: (chapterId: string, data: CreateTopicDto): Promise<Topic> =>
    request<Topic>(`/chapters/${chapterId}/topics`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTopicDto): Promise<Topic> =>
    request<Topic>(`/topics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    request<void>(`/topics/${id}`, { method: 'DELETE' }),
};

export const questionsApi = {
  list: (topicId: string): Promise<Question[]> =>
    request<Question[]>(`/topics/${topicId}/questions`),

  getById: (id: string): Promise<Question> =>
    request<Question>(`/questions/${id}`),

  create: (topicId: string, data: CreateQuestionDto): Promise<Question> =>
    request<Question>(`/topics/${topicId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateQuestionDto): Promise<Question> =>
    request<Question>(`/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    request<void>(`/questions/${id}`, { method: 'DELETE' }),
};
