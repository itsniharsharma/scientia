import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { topicsApi } from '../../../lib/api';
import type { CreateTopicDto, UpdateTopicDto } from '@scientia/types';

const topicsKey = (chapterId: string) =>
  ['chapters', chapterId, 'topics'] as const;

export function useTopics(chapterId: string) {
  return useQuery({
    queryKey: topicsKey(chapterId),
    queryFn: () => topicsApi.list(chapterId),
  });
}

export function useCreateTopic(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTopicDto) => topicsApi.create(chapterId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: topicsKey(chapterId) });
    },
  });
}

export function useUpdateTopic(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopicDto }) =>
      topicsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: topicsKey(chapterId) });
    },
  });
}

export function useDeleteTopic(chapterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: topicsKey(chapterId) });
    },
  });
}
