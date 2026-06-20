import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../routes';

export function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <Link
        to={ROUTES.HOME}
        className="mb-10 flex items-center gap-2.5 text-xl font-bold text-brand-700"
      >
        <HexIcon />
        Scientia
      </Link>
      <div className="w-full max-w-sm">
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
