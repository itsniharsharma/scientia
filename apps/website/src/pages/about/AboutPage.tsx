import { Link } from 'react-router-dom';
import { Container } from '../../components/Container';
import { Section } from '../../components/Section';
import { Card } from '../../components/Card';
import { ROUTES } from '../../routes';

const values = [
  {
    title: 'Academic Rigour',
    description:
      "We don't cut corners. Every concept is taught from first principles, with the depth and precision that competitive exams actually demand.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    title: 'Student First',
    description:
      "Every feature is designed for the student's learning outcome, not for flashy metrics. If it doesn't help you score better, we don't build it.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'Continuous Improvement',
    description:
      'Our content evolves with exam trends. We analyse past papers, track student performance, and update our curriculum to stay one step ahead.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 4-6" />
      </svg>
    ),
  },
];

export function AboutPage() {
  return (
    <>
      {/* Page hero */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <Container narrow>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
              About Scientia
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              We believe every student deserves access to structured, high-quality chemistry
              education — regardless of where they live or what school they attend.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <Section>
        <Container narrow>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
                Our Mission
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Chemistry is the foundation of JEE and NEET success — yet most students approach
                it without structure. They jump between topics, solve random questions, and wonder
                why their scores don't improve.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Scientia changes that. We've built a systematic, assessment-first approach that
                takes you from NCERT basics to advanced problem-solving with clarity and
                confidence. No guesswork. No scattered prep. Just a structured path that works.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Founded', value: '2023' },
                { label: 'Students Enrolled', value: '5,000+' },
                { label: 'Questions in Bank', value: '10,000+' },
                { label: 'Mock Tests Available', value: '500+' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-5 py-4"
                >
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  <span className="text-lg font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section muted>
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
              What we stand for
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Three principles that guide every decision we make.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} hover className="flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  {v.icon}
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {v.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section>
        <Container narrow>
          <div className="rounded-2xl bg-brand-700 px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-white lg:text-3xl">
              Ready to start?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-brand-200">
              Join thousands of students already on the Scientia program.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to={ROUTES.SIGNUP}
                className="inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                Get Started Free
              </Link>
              <Link
                to={ROUTES.CONTACT}
                className="inline-flex rounded-xl border border-brand-500 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
