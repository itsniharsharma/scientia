import { z } from 'zod';

export const createChapterSchema = z.object({
  name: z
    .string({ required_error: 'Chapter name is required' })
    .trim()
    .min(1, 'Chapter name is required'),
});

export const updateChapterSchema = createChapterSchema;

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = CreateChapterInput;
