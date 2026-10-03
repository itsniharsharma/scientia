import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ROUTES } from '../../routes';
import { loginTeacher, warmUpServer } from '../../lib/auth.api';
import { getApiErrorMessage } from '../../lib/api-error';
import { useSlowFlag } from '../../lib/use-slow-flag';
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

  const isSlow = useSlowFlag(isSubmitting);

  // Start waking the backend while the user is still typing.
  useEffect(() => {
    warmUpServer();
  }, []);

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const result = await loginTeacher(data);
      setAuth(result.user);
      navigate(ROUTES.TEACHER_TESTS);
    } catch (err: unknown) {
      // Only the server can say the credentials are wrong — a timeout or proxy
      // error during a backend cold start must not be shown as one.
      setServerError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          Teacher Portal
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Teacher sign in</h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Access your class dashboard, monitor student progress, and manage assessments.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
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
              <a href="#" className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
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

        {isSlow && (
          <p role="status" className="text-center text-xs text-slate-500 dark:text-slate-400">
            Waking up the server — the first sign-in after a quiet period can take up to a minute.
          </p>
        )}
      </form>

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Are you a student?{' '}
        <Link
          to={ROUTES.STUDENT_LOGIN}
          className="font-semibold text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-400"
        >
          Student login →
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
        Need a teacher account?{' '}
        <Link
          to={ROUTES.CONTACT}
          className="font-semibold text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-400"
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
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
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
