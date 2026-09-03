import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBatch, addStudentToBatch, removeStudentFromBatch } from '../../lib/batches.api';
import { ROUTES } from '../../routes';
import type { TestDto } from '../../types/test';
import type { BatchStudentDto } from '../../types/batch';

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TestDto['status'] }) {
  const map: Record<TestDto['status'], string> = {
    DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    SCHEDULED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Add Student Form ──────────────────────────────────────────────────────────

function AddStudentRow({ batchId }: { batchId: string }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => addStudentToBatch(batchId, username.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batch', batchId] });
      qc.invalidateQueries({ queryKey: ['batches'] });
      setUsername('');
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Enter a username'); return; }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 pt-3">
      <div className="flex-1">
        <input
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(''); }}
          placeholder="Student username"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-brand-500 focus:ring-2 focus:border-transparent dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-600 dark:hover:bg-brand-700"
      >
        {mutation.isPending ? '…' : 'Add'}
      </button>
    </form>
  );
}

// ─── Student Row ───────────────────────────────────────────────────────────────

function StudentRow({ student, batchId }: { student: BatchStudentDto; batchId: string }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: () => removeStudentFromBatch(batchId, student.studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['batch', batchId] });
      qc.invalidateQueries({ queryKey: ['batches'] });
    },
  });

  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{student.username}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{student.fullName}</p>
      </div>
      <div className="flex items-center gap-2">
        {confirming ? (
          <>
            <span className="text-xs text-slate-500 dark:text-slate-400">Remove?</span>
            <button
              onClick={() => { setConfirming(false); mutation.mutate(); }}
              disabled={mutation.isPending}
              className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
            >
              Yes
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs text-slate-500 hover:underline dark:text-slate-400">
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors dark:text-slate-500 dark:hover:text-red-400"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => getBatch(batchId!),
    enabled: !!batchId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        Failed to load batch.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to={ROUTES.TEACHER_BATCHES}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Batches
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.name}</h1>
          <button
            onClick={() => navigate(ROUTES.TEACHER_BATCH_TEST_NEW(batchId!))}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors dark:bg-brand-600 dark:hover:bg-brand-700"
          >
            + Generate Test
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {data.studentCount} student{data.studentCount !== 1 ? 's' : ''} · {data.testCount} test{data.testCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students panel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Students</h2>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Add students by their username.</p>

          <AddStudentRow batchId={batchId!} />

          {data.students.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">No students yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
              {data.students.map((student) => (
                <StudentRow key={student.studentId} student={student} batchId={batchId!} />
              ))}
            </div>
          )}
        </div>

        {/* Tests panel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Tests</h2>

          {data.tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-400 dark:text-slate-500">No tests in this batch yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.tests.map((test: TestDto) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 cursor-pointer hover:border-slate-200 transition-colors dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600"
                  onClick={() => navigate(ROUTES.TEACHER_TEST(test.id))}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{test.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {test.questionCount}Q · {test.durationMinutes}min
                    </p>
                  </div>
                  <StatusPill status={test.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
