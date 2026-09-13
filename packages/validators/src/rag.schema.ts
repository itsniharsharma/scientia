import { z } from 'zod';

// Recent turns of the CURRENT chat session, sent by the client on every
// request so the (stateless, per-request) generation step can answer as a
// natural continuation instead of restarting the conversation each time.
// Never persisted server-side. Capped generously but finitely so a request
// body can't be used to smuggle an unbounded prompt into the LLM call.
const conversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

export const queryKnowledgeSchema = z.object({
  query: z
    .string({ required_error: 'Query is required' })
    .trim()
    .min(1, 'Query is required')
    .max(1000, 'Query must be 1000 characters or less'),
  history: z.array(conversationTurnSchema).max(12, 'history must be 12 turns or fewer').optional(),
});

export type QueryKnowledgeInput = z.infer<typeof queryKnowledgeSchema>;
