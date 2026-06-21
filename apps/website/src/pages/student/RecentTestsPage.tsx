import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listStudentAttempts } from '../../lib/student.api';
import { ROUTES } from '../../routes';
import type { AttemptSummaryDto } from '../../types/attempt';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function AttemptCard({ attempt }: { attempt: AttemptSummaryDto }) {
  const navigate = useNavigate();
  const scoreColor =
    attempt.score === null
      ? 'text-slate-400'
      : attempt.score >= 0
        ? 'text-green-700'
        : 'text-red-600';

  const isReviewable = attempt.status === 'SUBMITTED';

  return (
    <div
      onClick={() => isReviewable && navigate(ROUTES.STUDENT_REVIEW(attempt.id))}
      className={[
        'rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition',
        isReviewable ? 'cursor-pointer hover:shadow-lg hover:border-slate-200' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{attempt.testName}</h3>
          <p className="mt-1 text-sm text-slate-500">{attempt.questionCount} questions</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {attempt.submittedAt ? formatDate(attempt.submittedAt) : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-xl font-bold ${scoreColor}`}>{attempt.score ?? '—'}</p>
            <p className="text-xs text-slate-400">score</p>
          </div>
          {isReviewable && (
            <span className="text-xs font-medium text-brand-700">Review →</span>
          )}
        </div>
      </div>
      {attempt.status === 'SUBMITTED' && (
        <div className="mt-3 flex gap-4 border-t border-slate-50 pt-3 text-xs text-slate-500">
          <span className="text-green-600 font-medium">✓ {attempt.correctCount} correct</span>
          <span className="text-red-500 font-medium">✗ {attempt.wrongCount} wrong</span>
          <span className="text-slate-400">— {attempt.unattemptedCount} skipped</span>
        </div>
      )}
    </div>
  );
}

export default function RecentTestsPage() {
  const { data: attempts, isLoading, error } = useQuery({
    queryKey: ['student-attempts'],
    queryFn: listStudentAttempts,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recent Tests</h1>
        <p className="mt-1 text-sm text-slate-500">Your complete attempt history.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load attempts. Please refresh.
        </div>
      )}

      {attempts && attempts.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <p className="text-slate-500 font-medium">No completed tests yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Your results will appear here after submitting a test.
          </p>
        </div>
      )}

      {attempts && attempts.length > 0 && (
        <div className="flex flex-col gap-3">
          {attempts.map((a) => (
            <AttemptCard key={a.id} attempt={a} />
          ))}
        </div>
      )}
    </div>
  );
}
