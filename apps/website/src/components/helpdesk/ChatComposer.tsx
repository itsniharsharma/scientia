import { useState, type KeyboardEvent } from 'react';

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChatComposer({ onSubmit, disabled }: { onSubmit: (value: string) => void; disabled: boolean }) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        rows={1}
        aria-label="Ask the Scientia Helpdesk a question"
        className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-500"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send question"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-brand-600 dark:hover:bg-brand-700"
      >
        <SendIcon />
      </button>
    </div>
  );
}
