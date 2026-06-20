import { Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { ROUTES } from '../../../routes';

export function CallToAction() {
  return (
    <section className="bg-brand-700 py-24 lg:py-32">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">
            Start your journey to chemistry mastery today
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-brand-200">
            Join thousands of students who cracked JEE and NEET with Scientia's structured,
            assessment-driven program. Free to start. No commitment required.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to={ROUTES.SIGNUP}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              Get Started Free
              <ArrowRightIcon />
            </Link>
            <Link
              to={ROUTES.CONTACT}
              className="inline-flex items-center rounded-xl border border-brand-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:border-brand-300 hover:bg-brand-800"
            >
              Talk to a Teacher
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8H13M13 8L9 4M13 8L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
