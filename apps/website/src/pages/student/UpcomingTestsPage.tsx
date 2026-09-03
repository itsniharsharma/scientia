import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listScheduledTests } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';
import type { ScheduledTestDto } from '../../types/attempt';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_BADGE: Record<string, string> = {
  null: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  SUBMITTED: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  EXPIRED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  null: 'Available',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Completed',
  EXPIRED: 'Expired',
};

function TestRow({ test }: { test: ScheduledTestDto }) {
  const navigate = useNavigate();
  const statusKey = test.attemptStatus ?? 'null';
  const badgeClass = STATUS_BADGE[statusKey] ?? STATUS_BADGE['null'];
  const badgeLabel = STATUS_LABEL[statusKey] ?? 'Available';

  const canStart = !test.attempted || test.attemptStatus === 'IN_PROGRESS';
  const buttonLabel =
    test.attemptStatus === 'IN_PROGRESS'
      ? 'Continue'
      : test.attemptStatus === 'SUBMITTED'
        ? 'View Result'
        : 'Start Test';

  const handleAction = () => {
    if (test.attemptStatus === 'SUBMITTED' && test.attemptId) {
      navigate(ROUTES.STUDENT_RESULT(test.attemptId));
    } else {
      navigate(ROUTES.STUDENT_TEST_INSTRUCTIONS(test.id));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 truncate dark:text-white">{test.name}</h3>
          {test.batchName && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{test.batchName}</p>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {test.questionCount} questions &middot; {test.durationMinutes} min
          </p>
        </div>

        <div className="hidden sm:block text-right shrink-0 min-w-[140px]">
          <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Scheduled</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(test.scheduledAt)}</p>
        </div>

        <button
          onClick={handleAction}
          disabled={test.attemptStatus === 'EXPIRED'}
          className={[
            'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
            canStart
              ? 'bg-brand-700 text-white hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-700'
              : test.attemptStatus === 'SUBMITTED'
                ? 'border border-brand-700 text-brand-700 hover:bg-brand-50 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-950/30'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500',
          ].join(' ')}
        >
          {buttonLabel}
        </button>
      </div>

      <div className="mt-2 block sm:hidden text-xs text-slate-400 dark:text-slate-500">
        {formatDateTime(test.scheduledAt)}
      </div>
    </div>
  );
}

export default function UpcomingTestsPage() {
  const { data: tests, isLoading, error } = useQuery({
    queryKey: ['student-tests'],
    queryFn: listScheduledTests,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Upcoming Tests</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All tests scheduled for your batches.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent dark:border-brand-500" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Failed to load tests. Please refresh.
        </div>
      )}

      {tests && tests.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center dark:border-slate-700">
          <p className="text-slate-500 font-medium dark:text-slate-300">No upcoming tests.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Your teacher will schedule tests in your batch.
          </p>
        </div>
      )}

      {tests && tests.length > 0 && (
        <div className="flex flex-col gap-3">
          {tests.map((t) => (
            <TestRow key={t.id} test={t} />
          ))}
        </div>
      )}
    </div>
  );
}
