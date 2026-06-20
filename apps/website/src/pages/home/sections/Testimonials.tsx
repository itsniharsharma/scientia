import { Section } from '../../../components/Section';
import { Container } from '../../../components/Container';
import { Card } from '../../../components/Card';

const testimonials = [
  {
    quote:
      "Scientia's structured approach to physical chemistry completely changed how I study. I went from struggling with equilibrium to scoring full marks in that section on my JEE Mains.",
    name: 'Ayesha Sharma',
    detail: 'JEE Advanced 2024 — AIR 847',
    initials: 'AS',
  },
  {
    quote:
      "The chapter-wise tests showed me exactly where I was losing marks. I improved my NEET chemistry score by 40 points in just two months of consistent practice on Scientia.",
    name: 'Rohan Mehta',
    detail: 'NEET 2024 — 720 / 720',
    initials: 'RM',
  },
  {
    quote:
      "What I love is the clarity of explanations. Every concept is broken down so well that organic chemistry no longer feels overwhelming. The logic actually makes sense.",
    name: 'Priya Patel',
    detail: 'JEE Mains 2024 — 99.4 Percentile',
    initials: 'PP',
  },
];

export function Testimonials() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
            Students who trusted the process
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Results speak. Here's what students achieved with Scientia's structured program.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex flex-col justify-between">
              <div>
                <svg
                  width="32"
                  height="24"
                  viewBox="0 0 32 24"
                  fill="none"
                  className="text-brand-200"
                >
                  <path
                    d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0l1.6 3.2C10.4 4.8 7.6 7.2 7.2 11.2H14.4V24H0zm17.6 0V14.4C17.6 6.4 22.4 1.6 32 0l1.6 3.2C28 4.8 25.2 7.2 24.8 11.2H32V24H17.6z"
                    fill="currentColor"
                  />
                </svg>
                <p className="mt-4 text-sm leading-relaxed text-slate-700">{t.quote}</p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.detail}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
