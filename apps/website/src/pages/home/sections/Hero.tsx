import { Link } from 'react-router-dom';
import { Container } from '../../../components/Container';
import { ROUTES } from '../../../routes';

const stats = [
  { value: '5,000+', label: 'Active Students' },
  { value: '500+', label: 'Mock Tests' },
  { value: '10,000+', label: 'Practice Questions' },
  { value: '98%', label: 'JEE Pass Rate' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(29, 78, 216, 0.07) 0%, transparent 70%)',
        }}
      />

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            <span className="text-xs font-semibold uppercase tracking-wide sm:tracking-widest text-brand-700">
              Trusted by 5,000+ JEE &amp; NEET Aspirants
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[4.5rem]">
            Chemistry Excellence.{' '}
            <span className="text-brand-700">Structured Learning.</span>
            <br className="hidden sm:block" />
            {' '}Assessment-Driven Results.
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
            Scientia builds your chemistry foundation chapter by chapter — with concept-first
            teaching, targeted practice, and assessment-driven feedback that actually improves
            your rank.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to={ROUTES.SIGNUP}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-8 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
            >
              Get Started Free
              <ArrowRightIcon />
            </Link>
            <Link
              to={ROUTES.ABOUT}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="mt-20 border-t border-slate-100 pt-12">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
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
