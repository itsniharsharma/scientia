import { MiniMarkdown } from './MiniMarkdown';
import type { SourceRef } from '../../types/rag';

export interface HelpdeskMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceRef[];
  status?: 'pending' | 'error';
  /** The question this assistant message answers (or failed to answer) —
   *  carried on the message itself so retry works correctly regardless of
   *  how many other messages came after it. */
  query?: string;
}

function CitationList({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-2.5 border-t border-slate-200 pt-2.5 dark:border-slate-700">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Sources
      </p>
      <ul className="space-y-1">
        {sources.map((source, i) => {
          const label = [source.documentTitle, source.section, source.subsection].filter(Boolean).join(' — ');
          return (
            <li key={i} className="text-xs text-slate-500 dark:text-slate-400">
              {label}
              {source.page ? ` — p. ${source.page}` : ''}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="Scientia Helpdesk is thinking" role="status">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s] dark:bg-slate-500" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s] dark:bg-slate-500" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 dark:bg-slate-500" />
    </div>
  );
}

export function ChatMessage({ message, onRetry }: { message: HelpdeskMessage; onRetry?: () => void }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-sm text-white dark:bg-brand-600">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.status === 'pending') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <ThinkingIndicator />
        </div>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <p>{message.content}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-slate-50 px-4 py-3 text-sm text-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
        <MiniMarkdown text={message.content} />
        {message.sources && <CitationList sources={message.sources} />}
      </div>
    </div>
  );
}
