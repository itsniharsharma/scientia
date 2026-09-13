// Mirrors backend/src/modules/rag/core/types.ts's SourceRef/GenerationResult
// exactly — this is the real, existing /rag/query response shape, not an
// invented one.

export interface SourceRef {
  documentTitle: string;
  section: string | null;
  subsection: string | null;
  page: number;
}

export interface GenerationResult {
  answer: string;
  sources: SourceRef[];
  insufficientEvidence: boolean;
}

// Recent turns of the current chat session — held only in this session's
// component state (see useHelpdeskChat), never persisted. Sent on each
// request so the backend can answer as a natural continuation of the
// conversation instead of treating every message as a fresh, unrelated one.
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}
