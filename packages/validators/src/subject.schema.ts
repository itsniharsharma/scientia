import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z
    .string({ required_error: 'Subject name is required' })
    .trim()
    .min(1, 'Subject name is required'),
});

export const updateSubjectSchema = createSubjectSchema;

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = CreateSubjectInput;
