import { useEffect, useRef } from 'react';
import { ChatMessage, type HelpdeskMessage } from './ChatMessage';
import { HelpdeskEmptyState } from './HelpdeskEmptyState';
import { ChatComposer } from './ChatComposer';

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface HelpdeskPanelProps {
  messages: HelpdeskMessage[];
  isSubmitting: boolean;
  onSubmit: (query: string) => void;
  onRetry: (assistantMessageId: string) => void;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
}

export function HelpdeskPanel({ messages, isSubmitting, onSubmit, onRetry, onClose, panelRef }: HelpdeskPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Scientia Helpdesk"
      className={[
        'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl',
        'dark:border-slate-700 dark:bg-slate-900',
        // Desktop: docked panel above the floating trigger, bottom-right.
        'bottom-24 right-4 h-[600px] w-[calc(100vw-2rem)] sm:right-6 sm:w-[420px]',
        'max-h-[calc(100vh-7.5rem)]',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Scientia Helpdesk</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Knowledge, whenever you need it.</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Scientia Helpdesk"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      {messages.length === 0 ? (
        <HelpdeskEmptyState onSelectQuestion={onSubmit} />
      ) : (
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onRetry={message.status === 'error' ? () => onRetry(message.id) : undefined} />
          ))}
        </div>
      )}

      <ChatComposer onSubmit={onSubmit} disabled={isSubmitting} />
    </div>
  );
}
