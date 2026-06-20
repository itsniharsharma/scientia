import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chaptersApi } from '../../../lib/api';
import type { CreateChapterDto, UpdateChapterDto } from '@scientia/types';

const chaptersKey = (subjectId: string) =>
  ['subjects', subjectId, 'chapters'] as const;

export function useChapters(subjectId: string) {
  return useQuery({
    queryKey: chaptersKey(subjectId),
    queryFn: () => chaptersApi.list(subjectId),
  });
}

export function useCreateChapter(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChapterDto) => chaptersApi.create(subjectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaptersKey(subjectId) });
    },
  });
}

export function useUpdateChapter(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChapterDto }) =>
      chaptersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaptersKey(subjectId) });
    },
  });
}

export function useDeleteChapter(subjectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chaptersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaptersKey(subjectId) });
    },
  });
}
