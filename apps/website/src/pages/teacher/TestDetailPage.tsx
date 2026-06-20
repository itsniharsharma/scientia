import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTest, updateTest } from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import type { TestStatus } from '../../types/test';

const STATUS_BADGE: Record<TestStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
};

const STATUS_TRANSITIONS: Record<TestStatus, TestStatus | null> = {
  DRAFT: 'SCHEDULED',
  SCHEDULED: 'COMPLETED',
  COMPLETED: null,
};

const STATUS_ACTION_LABEL: Record<TestStatus, string> = {
  DRAFT: 'Mark as Scheduled',
  SCHEDULED: 'Mark as Completed',
  COMPLETED: '',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTest(testId!),
    enabled: !!testId,
  });

  const updateMutation = useMutation({
    mutationFn: (status: TestStatus) => updateTest(testId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading test...
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Test not found or failed to load.
      </div>
    );
  }

  const nextStatus = STATUS_TRANSITIONS[test.status];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to={ROUTES.TEACHER_TESTS}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← My Tests
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{test.name}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[test.status]}`}
            >
              {test.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(ROUTES.TEACHER_TEST_REVIEW(test.id))}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit Questions
          </button>
          {nextStatus && (
            <button
              onClick={() => updateMutation.mutate(nextStatus)}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
            >
              {STATUS_ACTION_LABEL[test.status]}
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Questions', String(test.questionCount)],
          ['Duration', `${test.durationMinutes} min`],
          ['Scheduled', formatDate(test.scheduledAt)],
          ['Created', formatDate(test.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Questions */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Questions ({test.questions.length})
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {test.questions.map((q, i) => (
            <div key={q.id} className="px-6 py-4">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {q.questionType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {q.questionText ?? <span className="italic text-slate-400">Image-only question</span>}
                  </p>
                  {q.optionsJson.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {q.optionsJson.map((opt) => (
                        <div
                          key={opt.id}
                          className={[
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs',
                            opt.isCorrect
                              ? 'bg-green-50 text-green-800 font-medium'
                              : 'bg-slate-50 text-slate-600',
                          ].join(' ')}
                        >
                          {opt.isCorrect && (
                            <svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {opt.optionText ?? 'Image option'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
