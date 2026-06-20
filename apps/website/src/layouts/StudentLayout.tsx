import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { ROUTES } from '../routes';

export function StudentLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const name = user && 'fullName' in user ? user.fullName : '';

  const handleSignOut = () => {
    clearAuth();
    navigate(ROUTES.STUDENT_LOGIN);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.HOME} className="flex items-center gap-2 text-brand-700">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 2L29.856 9.5V24.5L16 32L2.144 24.5V9.5L16 2Z"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="16" cy="16" r="4" fill="currentColor" />
              </svg>
              <span className="text-sm font-bold tracking-tight">Scientia</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to={ROUTES.STUDENT_DASHBOARD}
              className="text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              Student Portal
            </Link>
          </div>

          <div className="flex items-center gap-5">
            <Link
              to={ROUTES.STUDENT_DASHBOARD}
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              Dashboard
            </Link>
            <Link
              to={ROUTES.STUDENT_TESTS}
              className="text-sm font-medium text-slate-600 hover:text-brand-700"
            >
              My Tests
            </Link>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-5">
              <span className="text-sm text-slate-500">{name}</span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
