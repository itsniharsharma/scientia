import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ROUTES } from '../../routes';
import { registerStudent } from '../../lib/auth.api';
import { useAuthStore } from '../../store/auth.store';

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const result = await registerStudent(data);
      setAuth(result.user, result.token);
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to={ROUTES.STUDENT_LOGIN} className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField label="Full Name" error={errors.fullName?.message}>
          <input
            {...register('fullName')}
            type="text"
            placeholder="Ayesha Sharma"
            autoComplete="name"
            className={inputClass(!!errors.fullName)}
          />
        </FormField>

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

        <FormField label="Username" error={errors.username?.message}>
          <input
            {...register('username')}
            type="text"
            placeholder="ayesha_s"
            autoComplete="username"
            className={inputClass(!!errors.username)}
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClass(!!errors.password)}
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-1">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
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
      ? 'border-red-300 bg-red-50'
      : 'border-slate-200 bg-white focus:border-brand-400',
  ].join(' ');
}
