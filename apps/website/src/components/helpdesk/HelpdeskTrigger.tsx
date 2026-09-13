function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M16 6L6 16M6 6l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function HelpdeskTrigger({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Close Scientia Helpdesk' : 'Open Scientia Helpdesk'}
      aria-expanded={isOpen}
      className={[
        'fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full sm:right-6',
        'bg-brand-700 text-white shadow-lg shadow-brand-900/20 transition-all duration-200',
        'hover:scale-105 hover:bg-brand-800 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2',
        'active:scale-95',
        'dark:bg-brand-600 dark:hover:bg-brand-700 dark:focus-visible:ring-offset-slate-950',
      ].join(' ')}
    >
      {isOpen ? <CloseIcon /> : <PlusIcon />}
    </button>
  );
}
