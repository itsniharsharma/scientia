import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from '../components/Container';
import { ROUTES } from '../routes';
import { useAuthStore } from '../store/auth.store';

// ─── Avatar dropdown ──────────────────────────────────────────────────────────

function AvatarDropdown({
  username,
  role,
  onLogout,
}: {
  username: string;
  role: 'TEACHER' | 'STUDENT';
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white hover:bg-brand-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg">
          {/* Identity */}
          <div className="border-b border-slate-100 px-4 pb-3 pt-2">
            <p className="text-sm font-semibold text-slate-900">{username}</p>
            <p className="mt-0.5 text-xs text-slate-400">Role: {role === 'TEACHER' ? 'Teacher' : 'Student'}</p>
          </div>

          {/* Navigation */}
          <div className="py-1">
            {role === 'TEACHER' ? (
              <DropdownLink to={ROUTES.TEACHER_TESTS} onClick={() => setOpen(false)}>
                My Tests
              </DropdownLink>
            ) : (
              <>
                <DropdownLink to={ROUTES.STUDENT_DASHBOARD} onClick={() => setOpen(false)}>
                  Dashboard
                </DropdownLink>
                <DropdownLink to={ROUTES.STUDENT_TESTS} onClick={() => setOpen(false)}>
                  My Tests
                </DropdownLink>
              </>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 pt-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({ to, onClick, children }: { to: string; onClick: () => void; children: ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {children}
    </Link>
  );
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={[
        'text-sm font-medium transition-colors',
        active ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function HexIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2.5 10H17.5M2.5 5H17.5M2.5 15H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const role = user?.role ?? null;
  const username = user?.username ?? '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.HOME);
  };

  return (
    <header
      className={[
        'fixed top-0 z-50 w-full transition-all duration-200',
        scrolled ? 'bg-white shadow-sm' : 'bg-white/90 backdrop-blur-sm',
      ].join(' ')}
    >
      <Container>
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 text-xl font-bold text-brand-700"
          >
            <HexIcon />
            Scientia
          </Link>

          {/* Desktop center links */}
          {!isAuthenticated && (
            <div className="hidden items-center gap-8 md:flex">
              <NavLink to={ROUTES.ABOUT} active={pathname === ROUTES.ABOUT}>
                About
              </NavLink>
              <NavLink to={ROUTES.CONTACT} active={pathname === ROUTES.CONTACT}>
                Contact
              </NavLink>
            </div>
          )}

          {isAuthenticated && role === 'STUDENT' && (
            <div className="hidden items-center gap-8 md:flex">
              <NavLink to={ROUTES.STUDENT_DASHBOARD} active={pathname === ROUTES.STUDENT_DASHBOARD}>
                Dashboard
              </NavLink>
              <NavLink to={ROUTES.STUDENT_TESTS} active={pathname === ROUTES.STUDENT_TESTS}>
                My Tests
              </NavLink>
            </div>
          )}

          {isAuthenticated && role === 'TEACHER' && (
            <div className="hidden items-center gap-8 md:flex">
              <NavLink to={ROUTES.TEACHER_TESTS} active={pathname === ROUTES.TEACHER_TESTS}>
                My Tests
              </NavLink>
            </div>
          )}

          {/* Desktop right */}
          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.STUDENT_LOGIN}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Student Login
                </Link>
                <Link
                  to={ROUTES.TEACHER_LOGIN}
                  className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  Teacher Login
                </Link>
              </>
            ) : (
              <AvatarDropdown
                username={username}
                role={role as 'TEACHER' | 'STUDENT'}
                onLogout={handleLogout}
              />
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <Container>
            <div className="flex flex-col gap-1 py-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.ABOUT}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    About
                  </Link>
                  <Link
                    to={ROUTES.CONTACT}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Contact
                  </Link>
                  <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
                    <Link
                      to={ROUTES.STUDENT_LOGIN}
                      className="rounded-xl border border-brand-700 px-4 py-3 text-center text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                    >
                      Student Login
                    </Link>
                    <Link
                      to={ROUTES.TEACHER_LOGIN}
                      className="rounded-xl bg-brand-700 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                    >
                      Teacher Login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* Identity */}
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                      {username.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{username}</p>
                      <p className="text-xs text-slate-400">
                        {role === 'TEACHER' ? 'Teacher' : 'Student'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 border-t border-slate-100 pt-2">
                    {role === 'TEACHER' ? (
                      <Link
                        to={ROUTES.TEACHER_TESTS}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        My Tests
                      </Link>
                    ) : (
                      <>
                        <Link
                          to={ROUTES.STUDENT_DASHBOARD}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Dashboard
                        </Link>
                        <Link
                          to={ROUTES.STUDENT_TESTS}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          My Tests
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
