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
  null: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  SUBMITTED: 'bg-green-50 text-green-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
              {badgeLabel}
            </span>
          </div>
          <h3 className="font-semibold text-slate-900 truncate">{test.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {test.questionCount} questions &middot; {test.durationMinutes} min
          </p>
        </div>

        <div className="hidden sm:block text-right shrink-0 min-w-[140px]">
          <p className="text-xs text-slate-500 font-medium">Scheduled</p>
          <p className="text-xs text-slate-400">{formatDateTime(test.scheduledAt)}</p>
        </div>

        <button
          onClick={handleAction}
          disabled={test.attemptStatus === 'EXPIRED'}
          className={[
            'shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
            canStart
              ? 'bg-brand-700 text-white hover:bg-brand-800'
              : test.attemptStatus === 'SUBMITTED'
                ? 'border border-brand-700 text-brand-700 hover:bg-brand-50'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {buttonLabel}
        </button>
      </div>

      <div className="mt-2 block sm:hidden text-xs text-slate-400">
        {formatDateTime(test.scheduledAt)}
      </div>
    </div>
  );
}

export function StudentTestsPage() {
  const { data: tests, isLoading, error } = useQuery({
    queryKey: ['student-tests'],
    queryFn: listScheduledTests,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Tests</h1>
        <p className="mt-1 text-sm text-slate-500">All tests scheduled for you.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
          Loading tests...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load tests. Please refresh.
        </div>
      )}

      {tests && tests.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <p className="text-slate-500 font-medium">No scheduled tests yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Your teacher will schedule tests here.
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
