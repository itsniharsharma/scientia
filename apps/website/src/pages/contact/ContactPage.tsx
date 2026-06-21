import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Container } from '../../components/Container';
import { Section } from '../../components/Section';
import { Button } from '../../components/Button';

const schema = z.object({
  name: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(4, 'Please enter a subject'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type FormData = z.infer<typeof schema>;

const contactInfo = [
  {
    label: 'Email',
    value: 'info@scientia.in',
    href: 'mailto:info@scientia.in',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z" />
        <path d="M2 5l8 6 8-6" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V15a2 2 0 01-2 2h-1C7.82 17 3 12.18 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Address',
    value: 'Chemistry Excellence Centre, Kota, Rajasthan 324005',
    href: null,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2C6.686 2 4 4.686 4 8c0 4.418 6 10 6 10s6-5.582 6-10c0-3.314-2.686-6-6-6z" />
        <circle cx="10" cy="8" r="2" />
      </svg>
    ),
  },
  {
    label: 'Hours',
    value: 'Monday – Saturday, 9:00 AM – 6:00 PM IST',
    href: null,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 3" />
      </svg>
    ),
  },
];

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (_data: FormData) => {
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  return (
    <>
      <section className="bg-slate-50 py-12 sm:py-20 lg:py-28">
        <Container narrow>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Get in Touch
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Have a question about our program? Want to enrol or talk to a teacher? We'd love
              to hear from you.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Form */}
            <div>
              {submitted ? (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">Message sent!</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    We'll get back to you within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="Full Name" error={errors.name?.message}>
                      <input
                        {...register('name')}
                        type="text"
                        placeholder="Ayesha Sharma"
                        className={inputClass(!!errors.name)}
                      />
                    </FormField>
                    <FormField label="Email Address" error={errors.email?.message}>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="you@example.com"
                        className={inputClass(!!errors.email)}
                      />
                    </FormField>
                  </div>
                  <FormField label="Subject" error={errors.subject?.message}>
                    <input
                      {...register('subject')}
                      type="text"
                      placeholder="Question about the chemistry program"
                      className={inputClass(!!errors.subject)}
                    />
                  </FormField>
                  <FormField label="Message" error={errors.message?.message}>
                    <textarea
                      {...register('message')}
                      rows={5}
                      placeholder="Tell us more about what you'd like to know..."
                      className={inputClass(!!errors.message) + ' resize-none'}
                    />
                  </FormField>
                  <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto sm:self-start">
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Contact info */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">Contact Information</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Reach out via any of the channels below and our team will respond promptly.
              </p>
              <ul className="mt-8 flex flex-col gap-6">
                {contactInfo.map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-0.5 text-sm text-slate-700 hover:text-brand-700"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-slate-700">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none',
    'placeholder:text-slate-400',
    'focus:ring-2 focus:ring-brand-700 focus:ring-offset-1',
    'transition-colors duration-150',
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-slate-200 bg-white focus:border-brand-400',
  ].join(' ');
}
