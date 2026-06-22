import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { logout } from '../lib/auth.api';
import { ROUTES } from '../routes';

const NAV_ITEMS = [
  {
    to: ROUTES.TEACHER_BATCHES,
    label: 'Batches',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: ROUTES.TEACHER_TESTS,
    label: 'All Tests',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: ROUTES.TEACHER_PROFILE,
    label: 'Profile',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function TeacherLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = user && 'username' in user ? user.username : '';
  const initial = username.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try { await logout(); } catch { /* cookie cleared server-side; ignore network errors */ }
    clearAuth();
    navigate(ROUTES.HOME);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-slate-100 px-5">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 text-brand-700">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.TEACHER_BATCHES || to === ROUTES.TEACHER_TESTS}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{username}</p>
              <p className="text-xs text-slate-400">Teacher</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 text-brand-700">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-14 w-64 border-r border-slate-200 bg-white pb-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-0.5 px-3 pt-4">
              {NAV_ITEMS.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === ROUTES.TEACHER_BATCHES || to === ROUTES.TEACHER_TESTS}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    ].join(' ')
                  }
                >
                  {icon}
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-100 px-4 pt-4">
              <div className="flex items-center gap-2 pb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                  {initial}
                </div>
                <span className="text-sm font-medium text-slate-700">{username}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="md:ml-56">
        <div className="px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
