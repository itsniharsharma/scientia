import { useThemeStore } from '../store/theme.store';

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 1.5v2M9 14.5v2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M1.5 9h2M14.5 9h2M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M15.5 10.5a6.5 6.5 0 1 1-8-8 5.2 5.2 0 0 0 8 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100',
        'dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      ].join(' ')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
