import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { listTests, deleteTest } from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import type { TestDto, TestStatus } from '../../types/test';

const STATUS_BADGE: Record<TestStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SCHEDULED: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TestCard({ test, onDelete }: { test: TestDto; onDelete: (id: string) => void }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[test.status]}`}
            >
              {test.status}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 truncate">{test.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {test.questionCount} questions &middot; {test.durationMinutes} min
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            Scheduled: {formatDate(test.scheduledAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(ROUTES.TEACHER_TEST_REVIEW(test.id))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Review
          </button>
          <button
            onClick={() => navigate(ROUTES.TEACHER_TEST(test.id))}
            className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
          >
            View
          </button>
          {test.status === 'DRAFT' && (
            <button
              onClick={() => onDelete(test.id)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function TestListPage() {
  const queryClient = useQueryClient();
  const { data: tests, isLoading, error } = useQuery({ queryKey: ['tests'], queryFn: listTests });

  const deleteMutation = useMutation({
    mutationFn: deleteTest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tests'] }),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this draft test? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Tests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and schedule your generated tests.
          </p>
        </div>
        <Link
          to={ROUTES.TEACHER_TEST_NEW}
          className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
        >
          + Generate New Test
        </Link>
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
          <p className="text-slate-500 font-medium">No tests yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Generate your first test to get started.
          </p>
          <Link
            to={ROUTES.TEACHER_TEST_NEW}
            className="mt-4 inline-block rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Generate Test
          </Link>
        </div>
      )}

      {tests && tests.length > 0 && (
        <div className="flex flex-col gap-4">
          {tests.map((t) => (
            <TestCard key={t.id} test={t} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
