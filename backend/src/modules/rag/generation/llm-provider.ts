import type { ConversationTurn, RetrievedContext } from '../core/types';
import type { ParsedGeneration } from './prompts';

export interface GenerationInput {
  systemInstructions: string;
  query: string;
  context: RetrievedContext;
  /** Recent turns of the current chat session, oldest first, for
   *  conversational continuity only — never used to decide what counts as
   *  evidence. Optional and typically short (a handful of turns). */
  history?: ConversationTurn[];
}

/** Provider-agnostic generation boundary. Receives already-retrieved
 *  context — it never queries Qdrant or any retrieval component itself.
 *  Returns which evidence items the answer actually drew from (see
 *  prompts.ts's ParsedGeneration) so citations can be narrowed to sources
 *  that genuinely support the answer, not everything retrieval found. */
export interface LLMProvider {
  generate(input: GenerationInput): Promise<ParsedGeneration>;
}
