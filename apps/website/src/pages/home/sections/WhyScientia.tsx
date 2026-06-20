import { Section } from '../../../components/Section';
import { Container } from '../../../components/Container';
import { Card } from '../../../components/Card';

const pillars = [
  {
    title: 'Concept Clarity',
    description:
      'Every chapter begins with first-principles teaching — no shortcuts, no rote-learning. Build the kind of understanding that holds up under JEE Advanced pressure.',
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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
    ),
  },
  {
    title: 'Structured Curriculum',
    description:
      'A carefully sequenced syllabus that builds complexity progressively — from NCERT foundations to advanced multi-concept problems, in the exact order that works.',
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
        <path d="M4 6h16M4 10h12M4 14h10M4 18h6" />
      </svg>
    ),
  },
  {
    title: 'Chapter-wise Practice',
    description:
      'Targeted question sets for every topic. Practice exactly what you learned, identify gaps immediately, and fix them before moving to the next chapter.',
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
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12h6M12 9v6" />
      </svg>
    ),
  },
  {
    title: 'Assessment-Driven Learning',
    description:
      'Regular timed tests with detailed performance analytics. Know your weak areas before exam day — not after — so you can actually do something about them.',
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

export function WhyScientia() {
  return (
    <Section muted>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
            Why students choose Scientia
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            We've distilled what the best chemistry students do differently — and built it
            into every lesson, every test, every feedback loop.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <Card key={pillar.title} hover className="flex flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                {pillar.icon}
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900">{pillar.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {pillar.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
