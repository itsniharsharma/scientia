import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentBatch } from '../../lib/student.api';
import { ROUTES } from '../../routes';

export default function StudentBatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-batch', batchId],
    queryFn: () => getStudentBatch(batchId!),
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load batch.
      </div>
    );
  }

  const joined = new Date(data.joinedAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-lg">
      <Link
        to={ROUTES.STUDENT_BATCHES}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Batches
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">{data.name}</h1>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <dl className="space-y-4">
          <div className="flex justify-between border-b border-slate-50 pb-4">
            <dt className="text-sm text-slate-500">Batch Name</dt>
            <dd className="text-sm font-semibold text-slate-800">{data.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-4">
            <dt className="text-sm text-slate-500">Teacher</dt>
            <dd className="text-sm font-semibold text-slate-800">{data.teacherUsername}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-4">
            <dt className="text-sm text-slate-500">Total Students</dt>
            <dd className="text-sm font-semibold text-slate-800">{data.studentCount}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-4">
            <dt className="text-sm text-slate-500">Tests</dt>
            <dd className="text-sm font-semibold text-slate-800">{data.testCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Joined</dt>
            <dd className="text-sm font-semibold text-slate-800">{joined}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
