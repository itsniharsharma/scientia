import { z } from 'zod';

const optionSnapshotSchema = z.object({
  id: z.string(),
  position: z.number().int().min(1),
  optionText: z.string().nullable().optional(),
  optionImageUrl: z.string().nullable().optional(),
  latexContent: z.string().nullable().optional(),
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

  batchId: z.string().min(1, 'Batch is required').optional(),
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

// ─── Create test question (in-review authoring) ───────────────────────────────

const createTestQuestionOptionSchema = z
  .object({
    position: z.number().int().min(0),
    optionText: z.string().trim().min(1).optional(),
    optionImageUrl: z.string().trim().min(1).optional(),
    latexContent: z.string().trim().min(1).optional(),
    isCorrect: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.optionText && !data.optionImageUrl && !data.latexContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Each option requires optionText, optionImageUrl, or latexContent',
        path: ['optionText'],
      });
    }
  });

export const createTestQuestionSchema = z
  .object({
    questionType: z.enum(['SINGLE_CHOICE', 'MULTI_CHOICE', 'INTEGER'] as const),
    questionText: z.string().trim().min(1, 'Question text cannot be empty').optional(),
    questionImageUrl: z.string().trim().min(1, 'Question image URL cannot be empty').optional(),
    latexContent: z.string().trim().min(1, 'LaTeX content cannot be empty').optional(),
    options: z.array(createTestQuestionOptionSchema).optional(),
    integerAnswer: z
      .number({ invalid_type_error: 'integerAnswer must be a number' })
      .int()
      .optional(),
    publishToQuestionBank: z.boolean().default(false),
    topicId: z.string().uuid('Invalid topic').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.questionText && !data.questionImageUrl && !data.latexContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of questionText, questionImageUrl, or latexContent is required',
        path: ['questionText'],
      });
    }

    if (data.questionType === 'INTEGER') {
      if (data.options && data.options.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'INTEGER questions cannot have options',
          path: ['options'],
        });
      }
      if (data.integerAnswer === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'INTEGER questions require integerAnswer',
          path: ['integerAnswer'],
        });
      }
    }

    if (data.questionType === 'SINGLE_CHOICE' || data.questionType === 'MULTI_CHOICE') {
      if (data.integerAnswer !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choice questions cannot have integerAnswer',
          path: ['integerAnswer'],
        });
      }
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choice questions require at least one option',
          path: ['options'],
        });
      } else {
        const correctCount = data.options.filter((o) => o.isCorrect).length;
        if (data.questionType === 'SINGLE_CHOICE' && correctCount !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'SINGLE_CHOICE questions must have exactly one correct option',
            path: ['options'],
          });
        }
        if (data.questionType === 'MULTI_CHOICE' && correctCount < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'MULTI_CHOICE questions must have at least one correct option',
            path: ['options'],
          });
        }
      }
    }

    if (data.publishToQuestionBank && !data.topicId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Topic is required when publishing to the Question Bank',
        path: ['topicId'],
      });
    }
  });

export type CreateTestQuestionInput = z.infer<typeof createTestQuestionSchema>;
