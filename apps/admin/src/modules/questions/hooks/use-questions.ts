import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../lib/api';
import type { CreateQuestionDto, UpdateQuestionDto } from '@scientia/types';

const questionsKey = (topicId: string) =>
  ['topics', topicId, 'questions'] as const;

const questionKey = (id: string) => ['questions', id] as const;

export function useQuestions(topicId: string) {
  return useQuery({
    queryKey: questionsKey(topicId),
    queryFn: () => questionsApi.list(topicId),
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: questionKey(id),
    queryFn: () => questionsApi.getById(id),
  });
}

export function useCreateQuestion(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestionDto) =>
      questionsApi.create(topicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionsKey(topicId) });
    },
  });
}

export function useUpdateQuestion(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionDto }) =>
      questionsApi.update(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: questionsKey(topicId) });
      qc.setQueryData(questionKey(updated.id), updated);
    },
  });
}

export function useDeleteQuestion(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: questionsKey(topicId) });
    },
  });
}
