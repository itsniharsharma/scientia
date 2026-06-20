import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from '../components/Container';
import { ROUTES } from '../routes';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={[
        'fixed top-0 z-50 w-full transition-all duration-200',
        scrolled ? 'bg-white shadow-sm' : 'bg-white/90 backdrop-blur-sm',
      ].join(' ')}
    >
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 text-xl font-bold text-brand-700"
          >
            <HexIcon />
            Scientia
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <NavLink to={ROUTES.ABOUT} active={pathname === ROUTES.ABOUT}>
              About
            </NavLink>
            <NavLink to={ROUTES.CONTACT} active={pathname === ROUTES.CONTACT}>
              Contact
            </NavLink>
          </div>

          <div className="hidden items-center gap-3 md:flex">
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
          </div>

          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>
      </Container>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <Container>
            <div className="flex flex-col gap-1 py-4">
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
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
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
