import { z } from 'zod';

export const createTopicSchema = z.object({
  name: z
    .string({ required_error: 'Topic name is required' })
    .trim()
    .min(1, 'Topic name is required'),
});

export const updateTopicSchema = z.object({
  name: z
    .string({ required_error: 'Topic name is required' })
    .trim()
    .min(1, 'Topic name is required'),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
