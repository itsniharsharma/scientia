import { z } from 'zod';

const optionSnapshotSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  optionText: z.string().nullable().optional(),
  optionImageUrl: z.string().nullable().optional(),
  isCorrect: z.boolean(),
});

export const generateTestSchema = z.object({
  name: z
    .string({ required_error: 'Test name is required' })
    .trim()
    .min(1, 'Test name is required')
    .max(100, 'Test name must be 100 characters or less'),

  subjectId: z.string({ required_error: 'Subject is required' }).uuid('Invalid subject'),

  topicIds: z
    .array(z.string().uuid('Invalid topic ID'))
    .min(1, 'Select at least one topic'),

  questionCount: z
    .number({ required_error: 'Number of questions is required' })
    .int()
    .min(1, 'Must select at least 1 question')
    .max(200, 'Cannot exceed 200 questions'),

  durationMinutes: z
    .number({ required_error: 'Duration is required' })
    .int()
    .min(5, 'Minimum duration is 5 minutes')
    .max(480, 'Maximum duration is 480 minutes'),

  scheduledAt: z
    .string({ required_error: 'Schedule date is required' })
    .datetime({ message: 'Invalid date format' }),
});

export type GenerateTestInput = z.infer<typeof generateTestSchema>;

export const updateTestSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z.enum(['DRAFT', 'SCHEDULED', 'COMPLETED']).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export type UpdateTestInput = z.infer<typeof updateTestSchema>;

export const updateTestQuestionSchema = z
  .object({
    questionText: z.string().min(1, 'Question text cannot be empty').optional(),
    questionImageUrl: z.string().nullable().optional(),
    optionsJson: z.array(optionSnapshotSchema).optional(),
    position: z.number().int().min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' });

export type UpdateTestQuestionInput = z.infer<typeof updateTestQuestionSchema>;

export const addReplacementQuestionSchema = z.object({
  originalQuestionId: z.string({ required_error: 'Question is required' }).uuid(),
  position: z.number({ required_error: 'Position is required' }).int().min(1),
});

export type AddReplacementQuestionInput = z.infer<typeof addReplacementQuestionSchema>;

export const reorderTestQuestionsSchema = z.object({
  order: z
    .array(z.object({ id: z.string().uuid(), position: z.number().int().min(1) }))
    .min(1, 'Order array cannot be empty'),
});

export type ReorderTestQuestionsInput = z.infer<typeof reorderTestQuestionsSchema>;
