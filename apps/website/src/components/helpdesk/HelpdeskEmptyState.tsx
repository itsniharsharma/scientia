const SUGGESTED_QUESTIONS = [
  'What is Scientia?',
  'How does Scientia work?',
  'What features does Scientia provide?',
  'What subscriptions are available?',
  'How do examinations work?',
];

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-brand-700 dark:text-brand-400">
      <path
        d="M11 2.5L12.6 8.4L18.5 10L12.6 11.6L11 17.5L9.4 11.6L3.5 10L9.4 8.4L11 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HelpdeskEmptyState({ onSelectQuestion }: { onSelectQuestion: (question: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40">
        <SparkIcon />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">How can we help?</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        Ask about Scientia, its features, policies, subscriptions, examinations, or how the platform works.
      </p>

      <div className="mt-6 flex w-full flex-col gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelectQuestion(question)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
