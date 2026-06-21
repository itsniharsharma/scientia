import { Link } from 'react-router-dom';
import { Container } from '../components/Container';
import { ROUTES } from '../routes';

const quickLinks = [
  { to: ROUTES.HOME, label: 'Home' },
  { to: ROUTES.ABOUT, label: 'About' },
  { to: ROUTES.CONTACT, label: 'Contact' },
  { to: ROUTES.STUDENT_LOGIN, label: 'Student Login' },
  { to: ROUTES.TEACHER_LOGIN, label: 'Teacher Login' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <Container>
        <div className="grid grid-cols-1 gap-8 py-12 sm:gap-12 sm:py-16 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2.5 text-xl font-bold text-brand-700"
            >
              <HexIcon />
              Scientia
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              India's most structured chemistry coaching platform for JEE and NEET aspirants.
              Built for students who are serious about results.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Contact
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:info@scientia.in"
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                >
                  info@scientia.in
                </a>
              </li>
              <li>
                <a
                  href="tel:+919876543210"
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="text-sm leading-relaxed text-slate-500">
                Chemistry Excellence Centre
                <br />
                Kota, Rajasthan 324005
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 py-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Scientia. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">Structured learning. Real results.</p>
        </div>
      </Container>
    </footer>
  );
}

function HexIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
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
