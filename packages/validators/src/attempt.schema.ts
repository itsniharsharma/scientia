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

// ─── Exam integrity ───────────────────────────────────────────────────────────

export const integrityEventTypes = [
  'FOCUS_LOST',
  'TAB_HIDDEN',
  'PAGE_EXIT',
  'SCREENSHOT_KEY',
  'RETURNED',
] as const;

// Timestamps are the client's epoch milliseconds. `sentAt` is the client clock
// when the batch was sent; the server uses it to correct for clock skew.
export const recordIntegrityEventsSchema = z.object({
  sentAt: z.number().int().positive(),
  events: z
    .array(
      z.object({
        clientEventId: z.string().uuid(),
        episodeId: z.string().uuid(),
        type: z.enum(integrityEventTypes),
        occurredAt: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(100),
});

export type RecordIntegrityEventsInput = z.infer<typeof recordIntegrityEventsSchema>;
