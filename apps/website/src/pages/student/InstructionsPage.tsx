import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { listScheduledTests, startAttempt, getAttempt } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';

export function InstructionsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['student-tests'],
    queryFn: listScheduledTests,
  });

  const test = tests?.find((t) => t.id === testId);

  const startMutation = useMutation({
    mutationFn: async () => {
      // If already in progress, resume by fetching the existing attempt
      if (test?.attemptStatus === 'IN_PROGRESS' && test.attemptId) {
        return getAttempt(test.attemptId);
      }
      return startAttempt(testId!);
    },
    onSuccess: (attempt) => {
      navigate(ROUTES.STUDENT_EXAM(attempt.id));
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to start test. Please try again.';
      setError(msg);
      setStarting(false);
    },
  });

  const handleStart = () => {
    setStarting(true);
    setError(null);
    startMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  if (!test) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Test not found or not yet scheduled.
      </div>
    );
  }

  if (test.attemptStatus === 'SUBMITTED') {
    return (
      <div className="mx-auto max-w-xl text-center py-20">
        <p className="text-lg font-semibold text-slate-800">You have already submitted this test.</p>
        <button
          onClick={() => navigate(ROUTES.STUDENT_RESULT(test.attemptId!))}
          className="mt-4 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
        >
          View Result
        </button>
      </div>
    );
  }

  const isResume = test.attemptStatus === 'IN_PROGRESS';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Examination Instructions
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{test.name}</h1>
        </div>

        {/* Test Info */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoCard
            icon="📝"
            label="Questions"
            value={String(test.questionCount)}
          />
          <InfoCard
            icon="⏱"
            label="Duration"
            value={`${test.durationMinutes} min`}
          />
          <InfoCard
            icon="📅"
            label="Scheduled"
            value={new Date(test.scheduledAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          />
        </div>

        {/* Marking Scheme */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Marking Scheme
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <MarkCard color="green" label="Correct Answer" value="+4" />
            <MarkCard color="red" label="Wrong Answer" value="−1" />
            <MarkCard color="slate" label="Unattempted" value="0" />
          </div>
        </div>

        {/* Rules */}
        <div className="mb-8 rounded-xl bg-slate-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Important Rules</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-slate-400 shrink-0">•</span>
              The timer starts as soon as you click Start and cannot be paused.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 shrink-0">•</span>
              Your answers are saved automatically as you go.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 shrink-0">•</span>
              If you refresh or lose connection, your progress is recovered on return.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 shrink-0">•</span>
              The test auto-submits when the timer reaches zero.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400 shrink-0">•</span>
              You can mark questions for review and return to them before submitting.
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
        >
          {starting
            ? 'Starting...'
            : isResume
              ? 'Resume Exam'
              : 'Start Exam'}
        </button>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function MarkCard({
  color,
  label,
  value,
}: {
  color: 'green' | 'red' | 'slate';
  label: string;
  value: string;
}) {
  const colorMap = {
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}
