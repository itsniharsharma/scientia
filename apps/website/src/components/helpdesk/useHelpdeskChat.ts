import { useCallback, useState } from 'react';
import { queryHelpdesk } from '../../lib/rag.api';
import type { HelpdeskMessage } from './ChatMessage';
import type { ConversationTurn } from '../../types/rag';

// How many prior turns to send for conversational continuity — enough for
// the model to follow the immediate thread without an unbounded, ever-
// growing request body. Kept in sync with the backend's own cap
// (queryKnowledgeSchema.history, packages/validators/src/rag.schema.ts).
const MAX_HISTORY_TURNS = 12;

function buildHistory(messages: HelpdeskMessage[]): ConversationTurn[] {
  return messages
    .filter((m) => m.content.trim().length > 0 && m.status !== 'pending' && m.status !== 'error')
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content }));
}

function classifyError(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;

  // Never surface internal error detail (stack traces, provider names,
  // secrets) — always a safe, generic, user-facing message.
  if (status === 401 || status === 403) {
    return 'Please log in to use the Scientia Helpdesk.';
  }
  if (status === 400) {
    return "That question couldn't be sent — try rephrasing it.";
  }
  if (!(err as { response?: unknown })?.response) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'Something went wrong while getting an answer. Please try again.';
}

let nextId = 0;
function messageId(): string {
  nextId += 1;
  return `helpdesk-msg-${Date.now()}-${nextId}`;
}

export function useHelpdeskChat() {
  const [messages, setMessages] = useState<HelpdeskMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runQuery = useCallback(async (query: string, assistantMessageId: string, history: ConversationTurn[]) => {
    setIsSubmitting(true);
    try {
      const result = await queryHelpdesk(query, history);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: result.answer, sources: result.sources, status: undefined }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, content: classifyError(err), status: 'error' } : m)),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const submit = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query || isSubmitting) return; // no duplicate submissions

      const history = buildHistory(messages);
      const userMessage: HelpdeskMessage = { id: messageId(), role: 'user', content: query };
      const assistantMessage: HelpdeskMessage = { id: messageId(), role: 'assistant', content: '', status: 'pending', query };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      void runQuery(query, assistantMessage.id, history);
    },
    [isSubmitting, messages, runQuery],
  );

  const retry = useCallback(
    (assistantMessageId: string) => {
      if (isSubmitting) return;
      const target = messages.find((m) => m.id === assistantMessageId);
      if (!target?.query) return;
      // History is everything before the ORIGINAL user message this
      // assistant reply answers, so a retry reconstructs the same
      // conversational context the first attempt had.
      const targetIndex = messages.findIndex((m) => m.id === assistantMessageId);
      const history = buildHistory(messages.slice(0, Math.max(targetIndex - 1, 0)));
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, status: 'pending', content: '' } : m)),
      );
      void runQuery(target.query, assistantMessageId, history);
    },
    [isSubmitting, messages, runQuery],
  );

  return { messages, submit, retry, isSubmitting };
}
