import { Fragment } from 'react';
import { Section } from '../../../components/Section';
import { Container } from '../../../components/Container';

const steps = [
  {
    number: '01',
    title: 'Subject',
    description: 'Select from Organic, Inorganic, or Physical Chemistry',
  },
  {
    number: '02',
    title: 'Chapter',
    description: 'Work through chapters in a proven learning sequence',
  },
  {
    number: '03',
    title: 'Topic',
    description: 'Master each topic with concept-first explanations',
  },
  {
    number: '04',
    title: 'Practice',
    description: 'Solve curated question sets targeting each concept',
  },
  {
    number: '05',
    title: 'Assessment',
    description: 'Take timed tests that mirror actual exam conditions',
  },
  {
    number: '06',
    title: 'Improvement',
    description: 'Get detailed analytics and act on your weak areas',
  },
];

export function LearningJourney() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 lg:text-4xl">
            Your learning journey, structured
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Every student follows the same proven path — from foundation to full mastery.
          </p>
        </div>

        {/* Desktop: horizontal flow */}
        <div className="relative mt-16 hidden lg:flex lg:items-start">
          {steps.map((step, i) => (
            <Fragment key={step.number}>
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className={[
                    'flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold',
                    i === 0
                      ? 'bg-brand-700 text-white'
                      : 'border-2 border-slate-200 bg-white text-slate-500',
                  ].join(' ')}
                >
                  {step.number}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1.5 max-w-[120px] text-xs leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="mt-7 h-px flex-none w-8 bg-slate-200" />
              )}
            </Fragment>
          ))}
        </div>

        {/* Mobile/tablet: 2-column list */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:hidden">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50 text-sm font-bold text-brand-700">
                {step.number}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
