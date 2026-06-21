import { z } from 'zod';

const QUESTION_TYPES = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'INTEGER'] as const;

const createOptionSchema = z
  .object({
    position: z
      .number({ required_error: 'Option position is required' })
      .int('Position must be an integer')
      .min(0, 'Position must be a non-negative integer'),
    optionText: z.string().trim().min(1, 'Option text cannot be empty').optional(),
    optionImageUrl: z
      .string()
      .trim()
      .min(1, 'Option image URL cannot be empty')
      .optional(),
    latexContent: z.string().trim().min(1, 'Option LaTeX cannot be empty').optional(),
    isCorrect: z.boolean({ required_error: 'isCorrect is required' }),
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

export const createQuestionSchema = z
  .object({
    type: z.enum(QUESTION_TYPES, {
      required_error: 'Question type is required',
      invalid_type_error: 'Invalid question type',
    }),
    questionText: z.string().trim().min(1, 'Question text cannot be empty').optional(),
    questionImageUrl: z
      .string()
      .trim()
      .min(1, 'Question image URL cannot be empty')
      .optional(),
    latexContent: z.string().trim().min(1, 'LaTeX content cannot be empty').optional(),
    options: z.array(createOptionSchema).optional(),
    integerAnswer: z.number({ invalid_type_error: 'integerAnswer must be a number' }).int('integerAnswer must be an integer').min(-2147483648, 'Value out of range').max(2147483647, 'Value out of range').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.questionText && !data.questionImageUrl && !data.latexContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one of questionText, questionImageUrl, or latexContent is required',
        path: ['questionText'],
      });
    }

    if (data.type === 'INTEGER') {
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

    if (data.type === 'SINGLE_CHOICE' || data.type === 'MULTI_CHOICE') {
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
        if (data.type === 'SINGLE_CHOICE' && correctCount !== 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'SINGLE_CHOICE questions must have exactly one correct option',
            path: ['options'],
          });
        }
        if (data.type === 'MULTI_CHOICE' && correctCount < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'MULTI_CHOICE questions must have at least one correct option',
            path: ['options'],
          });
        }
      }
    }
  });


export const updateQuestionSchema = z
  .object({
    questionText: z
      .string()
      .trim()
      .min(1, 'Question text cannot be empty')
      .nullable()
      .optional(),
    questionImageUrl: z
      .string()
      .trim()
      .min(1, 'Question image URL cannot be empty')
      .nullable()
      .optional(),
    latexContent: z
      .string()
      .trim()
      .min(1, 'LaTeX content cannot be empty')
      .nullable()
      .optional(),
    options: z.array(createOptionSchema).optional(),
    integerAnswer: z
      .number({ invalid_type_error: 'integerAnswer must be a number' })
      .int('integerAnswer must be an integer')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasAnyField =
      data.questionText !== undefined ||
      data.questionImageUrl !== undefined ||
      data.latexContent !== undefined ||
      data.options !== undefined ||
      data.integerAnswer !== undefined;

    if (!hasAnyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided for update',
        path: [],
      });
    }
  });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type UpdateOptionInput = z.infer<typeof createOptionSchema>;
