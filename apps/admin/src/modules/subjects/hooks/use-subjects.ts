import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../../../lib/api';
import type { CreateSubjectDto, UpdateSubjectDto } from '@scientia/types';

const SUBJECTS_KEY = ['subjects'] as const;

export function useSubjects() {
  return useQuery({
    queryKey: SUBJECTS_KEY,
    queryFn: subjectsApi.list,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectDto) => subjectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
    },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectDto }) =>
      subjectsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SUBJECTS_KEY });
    },
  });
}
