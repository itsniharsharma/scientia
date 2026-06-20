import { z } from 'zod';

const selectedAnswerSchema = z.union([
  z.object({
    type: z.literal('choice'),
    optionIds: z.array(z.string().uuid()),
  }),
  z.object({
    type: z.literal('integer'),
    value: z.number().int().nullable(),
  }),
]);

export const startAttemptSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
});

export const saveResponsesSchema = z.object({
  responses: z
    .array(
      z.object({
        testQuestionId: z.string().uuid(),
        selectedAnswerJson: selectedAnswerSchema.nullable(),
      }),
    )
    .min(1),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SaveResponsesInput = z.infer<typeof saveResponsesSchema>;
