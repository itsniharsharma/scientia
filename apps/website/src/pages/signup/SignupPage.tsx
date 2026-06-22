import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ROUTES } from '../../routes';
import { registerStudent } from '../../lib/auth.api';
import { useAuthStore } from '../../store/auth.store';

// ─── Validation ───────────────────────────────────────────────────────────────

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(8, 'Passkey must be at least 8 characters'),
});

type StudentFormData = z.infer<typeof studentSchema>;

type Role = 'STUDENT' | 'TEACHER';

// ─── Icon components ──────────────────────────────────────────────────────────

function StudentIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-brand-700">
      <path
        d="M16 4L28 10v2L16 18 4 12v-2L16 4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 14v8c0 2.5 3.6 4 8 4s8-1.5 8-4v-8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-violet-600">
      <rect x="4" y="5" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 20v5M22 20v5M7 25h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 12h8M10 9h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26" cy="10" r="4" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.4" />
      <path d="M25 10l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Step 1 — Role Selector ───────────────────────────────────────────────────

function RoleSelector({ onSelect }: { onSelect: (role: Role) => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Join Scientia
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Who are you?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Pick your role to get started
        </p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <RoleCard
          icon={<StudentIcon />}
          title="Student"
          description="Access tests, track progress and practice JEE problems"
          accent="brand"
          onClick={() => onSelect('STUDENT')}
        />
        <RoleCard
          icon={<TeacherIcon />}
          title="Teacher"
          description="Create tests, manage batches and monitor student progress"
          accent="violet"
          onClick={() => onSelect('TEACHER')}
        />
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to={ROUTES.STUDENT_LOGIN}
          className="font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: 'brand' | 'violet';
  onClick: () => void;
}) {
  const ringColor = accent === 'brand' ? 'hover:border-brand-400 hover:ring-brand-100' : 'hover:border-violet-400 hover:ring-violet-100';
  const bgHover = accent === 'brand' ? 'hover:bg-brand-50' : 'hover:bg-violet-50';
  const btnColor =
    accent === 'brand'
      ? 'bg-brand-700 hover:bg-brand-800 text-white'
      : 'bg-violet-600 hover:bg-violet-700 text-white';
  const iconBg = accent === 'brand' ? 'bg-brand-50' : 'bg-violet-50';

  return (
    <button
      onClick={onClick}
      className={[
        'group flex flex-1 flex-col items-start rounded-2xl border border-slate-200 p-5 text-left',
        'outline-none ring-2 ring-transparent transition-all duration-150',
        ringColor,
        bgHover,
        'focus-visible:ring-offset-2',
      ].join(' ')}
    >
      <div className={`mb-4 rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
      <p className="text-base font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      <div className={`mt-5 w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors ${btnColor}`}>
        Continue as {title}
      </div>
    </button>
  );
}

// ─── Step 2a — Student Registration Form ─────────────────────────────────────

function StudentSignupForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({ resolver: zodResolver(studentSchema) });

  const onSubmit = async (data: StudentFormData) => {
    setServerError(null);
    try {
      const result = await registerStudent({
        fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        phone: data.phone,
        username: data.username,
        password: data.password,
      });
      setAuth(result.user);
      navigate(ROUTES.STUDENT_DASHBOARD);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Something went wrong. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm">
      {/* Back + header */}
      <div className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <StudentIcon />
          Student
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to={ROUTES.STUDENT_LOGIN}
            className="font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" error={errors.firstName?.message}>
            <input
              {...register('firstName')}
              type="text"
              placeholder="Rohan"
              autoComplete="given-name"
              autoFocus
              className={inputClass(!!errors.firstName)}
            />
          </FormField>
          <FormField label="Last Name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              type="text"
              placeholder="Sharma"
              autoComplete="family-name"
              className={inputClass(!!errors.lastName)}
            />
          </FormField>
        </div>

        <FormField label="Phone Number" error={errors.phone?.message}>
          <input
            {...register('phone')}
            type="tel"
            placeholder="9876543210"
            autoComplete="tel"
            inputMode="numeric"
            className={inputClass(!!errors.phone)}
          />
        </FormField>

        <FormField
          label="Username"
          hint="This is your unique ID on Scientia"
          error={errors.username?.message}
        >
          <input
            {...register('username')}
            type="text"
            placeholder="rohan_s"
            autoComplete="username"
            className={inputClass(!!errors.username)}
          />
        </FormField>

        <FormField
          label="Passkey"
          hint="At least 8 characters"
          error={errors.password?.message}
        >
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClass(!!errors.password)}
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
          Create Account →
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

// ─── Step 2b — Teacher Info Card ─────────────────────────────────────────────

function TeacherInfoCard({ onBack }: { onBack: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeftIcon />
        Back
      </button>

      <div className="mb-7">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          <TeacherIcon />
          Teacher
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Teacher Account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          How teacher accounts work on Scientia
        </p>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="#7c3aed" strokeWidth="1.3" />
              <path d="M8 5v3.5M8 11v.5" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Accounts are provisioned by your institution
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Teacher accounts on Scientia are created by the platform
              administrator. If you're an educator, contact your institution's
              coordinator to get your login credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-6 flex flex-col gap-3">
        {[
          'Your coordinator creates your account',
          'You receive your username and passkey',
          'Log in using the Teacher Login page',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              {i + 1}
            </span>
            <p className="pt-0.5 text-sm text-slate-600">{step}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        to={ROUTES.TEACHER_LOGIN}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
      >
        Go to Teacher Login
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <p className="mt-4 text-center text-sm text-slate-500">
        Signing up as a student?{' '}
        <button
          onClick={onBack}
          className="font-semibold text-brand-700 hover:text-brand-800 transition-colors"
        >
          Go back
        </button>
      </p>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {hint && !error && (
          <span className="text-xs text-slate-400">{hint}</span>
        )}
      </div>
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
      ? 'border-red-300 bg-red-50'
      : 'border-slate-200 bg-white focus:border-brand-400',
  ].join(' ');
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function SignupPage() {
  const [role, setRole] = useState<Role | null>(null);

  if (role === 'STUDENT') {
    return <StudentSignupForm onBack={() => setRole(null)} />;
  }
  if (role === 'TEACHER') {
    return <TeacherInfoCard onBack={() => setRole(null)} />;
  }
  return <RoleSelector onSelect={setRole} />;
}
