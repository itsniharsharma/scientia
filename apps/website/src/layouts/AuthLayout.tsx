import { Outlet, Link } from 'react-router-dom';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { ROUTES } from '../routes';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 py-10 sm:py-16 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggleButton />
      </div>
      <Link
        to={ROUTES.HOME}
        className="mb-10 flex items-center gap-2.5 text-xl font-bold text-brand-700 dark:text-brand-400"
      >
        <HexIcon />
        Scientia
      </Link>
      <div className="w-full max-w-lg">
        <Outlet />
      </div>
    </div>
  );
}

function HexIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 1.5L19.66 6.5V16.5L11 21.5L2.34 16.5V6.5L11 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="11" r="2.5" fill="currentColor" />
    </svg>
  );
}
