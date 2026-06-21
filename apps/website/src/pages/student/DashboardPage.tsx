import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';
import type { ScheduledTestDto, AttemptSummaryDto } from '../../types/attempt';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function UpcomingTestCard({ test }: { test: ScheduledTestDto }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{test.name}</h3>
          {test.batchName && (
            <p className="mt-0.5 text-xs text-slate-400">{test.batchName}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {test.questionCount} questions &middot; {test.durationMinutes} min
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(test.scheduledAt)}</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.STUDENT_TEST_INSTRUCTIONS(test.id))}
          className="shrink-0 rounded-xl bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          Start Test
        </button>
      </div>
    </div>
  );
}

function RecentAttemptCard({ attempt }: { attempt: AttemptSummaryDto }) {
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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const { upcomingTests, recentAttempts, stats } = data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back. Here's your exam overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Tests Taken" value={stats.totalAttempts} />
        <StatCard
          label="Average Score"
          value={stats.averageScore !== null ? stats.averageScore : '—'}
        />
        <StatCard label="Upcoming Tests" value={upcomingTests.length} />
      </div>

      {/* Upcoming Tests preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Upcoming Tests</h2>
          <Link
            to={ROUTES.STUDENT_UPCOMING_TESTS}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all →
          </Link>
        </div>
        {upcomingTests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm text-slate-400">No upcoming tests scheduled.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingTests.slice(0, 3).map((t) => (
              <UpcomingTestCard key={t.id} test={t} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Attempts preview */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Recent Tests</h2>
          <Link
            to={ROUTES.STUDENT_RECENT_TESTS}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View all →
          </Link>
        </div>
        {recentAttempts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm text-slate-400">You haven't taken any tests yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentAttempts.slice(0, 3).map((a) => (
              <RecentAttemptCard key={a.id} attempt={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
