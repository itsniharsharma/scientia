import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ROUTES } from '../../routes';
import { registerStudent, registerTeacher } from '../../lib/auth.api';
import { listOrganisations, registerOrganisation } from '../../lib/organisations.api';
import { useAuthStore } from '../../store/auth.store';

// ─── Validation ───────────────────────────────────────────────────────────────

const nameSchema = {
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
};

const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores');

const passwordSchema = z.string().min(8, 'Passkey must be at least 8 characters');

const emailSchema = z.string().trim().email('Enter a valid email address');

const studentSchema = z.object({
  ...nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

type StudentFormData = z.infer<typeof studentSchema>;

// Organisation is selected from an existing list only — there is no
// free-text organisation-name field here. The dropdown is populated from
// GET /organisations, and the backend independently verifies the id exists.
const teacherSchema = z.object({
  ...nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  organisationId: z.string().min(1, 'Select an organisation'),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

const organisationSchema = z.object({
  name: z.string().trim().min(2, 'Organisation name must be at least 2 characters').max(100),
});

type OrganisationFormData = z.infer<typeof organisationSchema>;

type Role = 'STUDENT' | 'TEACHER' | 'ORGANISATION';

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

function OrganisationIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-amber-600">
      <path
        d="M6 28V8l10-5 10 5v20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 14h1m6 0h1m-8 5h1m6 0h1m-5 9v-6h2v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
    <div className="rounded-2xl border border-slate-100 bg-white px-6 py-9 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Join Scientia
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Who are you?
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Pick your role to get started
        </p>
      </div>

      {/* Role cards */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
        <RoleCard
          icon={<OrganisationIcon />}
          title="Organisation"
          description="Register your institution so teachers can join it"
          accent="amber"
          onClick={() => onSelect('ORGANISATION')}
        />
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.STUDENT_LOGIN}
          className="font-semibold text-brand-700 hover:text-brand-800 transition-colors dark:text-brand-400 dark:hover:text-brand-300"
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
  accent: 'brand' | 'violet' | 'amber';
  onClick: () => void;
}) {
  const ringColor = {
    brand: 'hover:border-brand-400 hover:ring-brand-100 dark:hover:border-brand-500 dark:hover:ring-brand-950/40',
    violet: 'hover:border-violet-400 hover:ring-violet-100 dark:hover:border-violet-500 dark:hover:ring-violet-950/40',
    amber: 'hover:border-amber-400 hover:ring-amber-100 dark:hover:border-amber-500 dark:hover:ring-amber-950/40',
  }[accent];
  const bgHover = {
    brand: 'hover:bg-brand-50 dark:hover:bg-brand-950/20',
    violet: 'hover:bg-violet-50 dark:hover:bg-violet-950/20',
    amber: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
  }[accent];
  const btnColor = {
    brand: 'bg-brand-700 hover:bg-brand-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700',
    violet: 'bg-violet-600 hover:bg-violet-700 text-white',
    amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  }[accent];
  const iconBg = {
    brand: 'bg-brand-50 dark:bg-brand-950/40',
    violet: 'bg-violet-50 dark:bg-violet-950/40',
    amber: 'bg-amber-50 dark:bg-amber-950/40',
  }[accent];

  return (
    <button
      onClick={onClick}
      className={[
        'group flex min-w-0 flex-1 flex-col items-start rounded-2xl border border-slate-200 p-4 text-left',
        'outline-none ring-2 ring-transparent transition-all duration-150',
        'dark:border-slate-700',
        ringColor,
        bgHover,
        'focus-visible:ring-offset-2',
      ].join(' ')}
    >
      <div className={`mb-4 rounded-xl p-2.5 ${iconBg}`}>{icon}</div>
      <p className="text-base font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <div className={`mt-5 w-full rounded-xl px-3 py-2.5 text-center text-sm font-semibold transition-colors ${btnColor}`}>
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
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone,
        email: data.email.trim(),
        username: data.username,
        password: data.password,
      });
      setAuth(result.user);
      navigate(ROUTES.STUDENT_DASHBOARD);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      setServerError(typeof raw === 'string' ? raw : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      {/* Back + header */}
      <div className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
          <StudentIcon />
          Student
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to={ROUTES.STUDENT_LOGIN}
            className="font-semibold text-brand-700 hover:text-brand-800 transition-colors dark:text-brand-400 dark:hover:text-brand-300"
          >
            Log in
          </Link>
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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

        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="rohan@example.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
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

      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

// ─── Step 2b — Teacher Signup Form ────────────────────────────────────────────

function TeacherSignupForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: organisations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['organisations'],
    queryFn: listOrganisations,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormData>({ resolver: zodResolver(teacherSchema) });

  const onSubmit = async (data: TeacherFormData) => {
    setServerError(null);
    try {
      const result = await registerTeacher({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone,
        email: data.email.trim(),
        username: data.username,
        password: data.password,
        organisationId: data.organisationId,
      });
      setAuth(result.user);
      navigate(ROUTES.TEACHER_TESTS);
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      setServerError(typeof raw === 'string' ? raw : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <div className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
          <TeacherIcon />
          Teacher
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to={ROUTES.TEACHER_LOGIN}
            className="font-semibold text-brand-700 hover:text-brand-800 transition-colors dark:text-brand-400 dark:hover:text-brand-300"
          >
            Log in
          </Link>
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First Name" error={errors.firstName?.message}>
            <input
              {...register('firstName')}
              type="text"
              placeholder="Priya"
              autoComplete="given-name"
              autoFocus
              className={inputClass(!!errors.firstName)}
            />
          </FormField>
          <FormField label="Last Name" error={errors.lastName?.message}>
            <input
              {...register('lastName')}
              type="text"
              placeholder="Rao"
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

        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="priya@institute.com"
            autoComplete="email"
            className={inputClass(!!errors.email)}
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
            placeholder="priya_rao"
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

        <FormField label="Organisation" error={errors.organisationId?.message}>
          <select
            {...register('organisationId')}
            disabled={loadingOrgs}
            defaultValue=""
            className={inputClass(!!errors.organisationId)}
          >
            <option value="" disabled>
              {loadingOrgs ? 'Loading organisations…' : 'Select organisation'}
            </option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {!loadingOrgs && organisations.length === 0 && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              No organisations exist yet.{' '}
              <button
                type="button"
                onClick={onBack}
                className="font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                Register one first
              </button>
              .
            </p>
          )}
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
          Create Account →
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

// ─── Step 2c — Organisation Signup Form ──────────────────────────────────────

function OrganisationSignupForm({ onBack }: { onBack: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganisationFormData>({ resolver: zodResolver(organisationSchema) });

  const onSubmit = async (data: OrganisationFormData) => {
    setServerError(null);
    try {
      const org = await registerOrganisation(data.name.trim());
      setCreated({ name: org.name });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      setServerError(typeof raw === 'string' ? raw : 'Something went wrong. Please try again.');
    }
  };

  if (created) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 text-center shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
          <OrganisationIcon />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">"{created.name}" is registered</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Teachers can now select {created.name} from the organisation dropdown when they sign up.
        </p>
        <Link
          to={ROUTES.TEACHER_LOGIN}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-700"
        >
          Continue to Teacher Signup
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-9 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <div className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeftIcon />
          Back
        </button>
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <OrganisationIcon />
          Organisation
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Register your organisation
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Once registered, your teachers can select it during their own signup.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Organisation Name" error={errors.name?.message}>
          <input
            {...register('name')}
            type="text"
            placeholder="Aakash Institute"
            autoFocus
            className={inputClass(!!errors.name)}
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
          Register Organisation →
        </Button>
      </form>
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
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
        {hint && !error && (
          <span className="text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none dark:text-white',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:ring-2 focus:ring-brand-700 focus:ring-offset-1 dark:focus:ring-brand-500 dark:focus:ring-offset-slate-800',
    'transition-colors duration-150',
    hasError
      ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
      : 'border-slate-200 bg-white focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-brand-500',
  ].join(' ');
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function SignupPage() {
  const [role, setRole] = useState<Role | null>(null);

  if (role === 'STUDENT') {
    return <StudentSignupForm onBack={() => setRole(null)} />;
  }
  if (role === 'TEACHER') {
    return <TeacherSignupForm onBack={() => setRole(null)} />;
  }
  if (role === 'ORGANISATION') {
    return <OrganisationSignupForm onBack={() => setRole(null)} />;
  }
  return <RoleSelector onSelect={setRole} />;
}
