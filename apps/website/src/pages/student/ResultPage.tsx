import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getAttempt } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';

export function ResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => getAttempt(attemptId!),
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading result...
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load result. Please try again.
      </div>
    );
  }

  if (attempt.status === 'IN_PROGRESS') {
    return (
      <div className="mx-auto max-w-lg text-center py-20">
        <p className="text-slate-600 font-medium">This attempt has not been submitted yet.</p>
        <Link
          to={ROUTES.STUDENT_EXAM(attemptId!)}
          className="mt-4 inline-block rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Continue Exam
        </Link>
      </div>
    );
  }

  const total = attempt.test.questionCount;
  const correct = attempt.correctCount ?? 0;
  const wrong = attempt.wrongCount ?? 0;
  const unattempted = attempt.unattemptedCount ?? 0;
  const score = attempt.score ?? 0;
  const maxScore = total * 4;
  const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;

  const scoreColor =
    percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600';

  const grade =
    percentage >= 90
      ? 'Excellent'
      : percentage >= 70
        ? 'Good'
        : percentage >= 50
          ? 'Average'
          : percentage >= 35
            ? 'Below Average'
            : 'Needs Improvement';

  return (
    <div className="mx-auto max-w-2xl">
      {/* Result card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm text-center mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          Submitted Successfully
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{attempt.test.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {new Date(attempt.submittedAt!).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* Score circle */}
        <div className="my-8">
          <p className={`text-6xl font-black ${scoreColor}`}>{score}</p>
          <p className="mt-1 text-sm text-slate-400">out of {maxScore}</p>
          <p className={`mt-2 text-lg font-semibold ${scoreColor}`}>{grade}</p>
          <div className="mt-3 mx-auto w-48 h-2 rounded-full bg-slate-100">
            <div
              className={[
                'h-2 rounded-full transition-all',
                percentage >= 70
                  ? 'bg-green-500'
                  : percentage >= 40
                    ? 'bg-yellow-400'
                    : 'bg-red-500',
              ].join(' ')}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{percentage}%</p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-6">
          <BreakdownCard
            label="Correct"
            value={correct}
            points={`+${correct * 4}`}
            color="text-green-600"
            bg="bg-green-50"
          />
          <BreakdownCard
            label="Wrong"
            value={wrong}
            points={`${-wrong}`}
            color="text-red-600"
            bg="bg-red-50"
          />
          <BreakdownCard
            label="Unattempted"
            value={unattempted}
            points="0"
            color="text-slate-500"
            bg="bg-slate-50"
          />
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Test Details</h2>
        <dl className="space-y-2.5 text-sm">
          <DetailRow label="Total Questions" value={String(total)} />
          <DetailRow label="Duration" value={`${attempt.test.durationMinutes} min`} />
          <DetailRow
            label="Time Started"
            value={new Date(attempt.startedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
          <DetailRow
            label="Submitted At"
            value={new Date(attempt.submittedAt!).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to={ROUTES.STUDENT_DASHBOARD}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Dashboard
        </Link>
        <Link
          to={ROUTES.STUDENT_TESTS}
          className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors text-center"
        >
          All Tests
        </Link>
      </div>
    </div>
  );
}

function BreakdownCard({
  label,
  value,
  points,
  color,
  bg,
}: {
  label: string;
  value: number;
  points: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl ${bg} p-4`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      <p className={`text-sm font-semibold ${color} mt-1`}>{points} pts</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
