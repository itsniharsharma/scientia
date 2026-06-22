import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ROUTES } from '../../routes';
import { loginTeacher } from '../../lib/auth.api';
import { useAuthStore } from '../../store/auth.store';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function TeacherLoginPage() {
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
      const result = await loginTeacher(data);
      setAuth(result.user);
      navigate(ROUTES.TEACHER_TESTS);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Invalid username or password.';
      setServerError(msg);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Teacher Portal
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teacher sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Access your class dashboard, monitor student progress, and manage assessments.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField label="Username" error={errors.username?.message}>
          <input
            {...register('username')}
            type="text"
            placeholder="teacher_username"
            autoComplete="username"
            className={inputClass(!!errors.username)}
          />
        </FormField>

        <FormField
          label={
            <div className="flex items-center justify-between">
              <span>Password</span>
              <a href="#" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                Forgot password?
              </a>
            </div>
          }
          error={errors.password?.message}
        >
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputClass(!!errors.password)}
          />
        </FormField>

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-1">
          Sign In to Dashboard
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-slate-400">
        Are you a student?{' '}
        <Link
          to={ROUTES.STUDENT_LOGIN}
          className="font-semibold text-slate-600 hover:text-brand-700"
        >
          Student login →
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-slate-400">
        Need a teacher account?{' '}
        <Link
          to={ROUTES.CONTACT}
          className="font-semibold text-slate-600 hover:text-brand-700"
        >
          Contact us
        </Link>
      </p>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: React.ReactNode;
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
