import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listStudentBatches } from '../../lib/student.api';
import { ROUTES } from '../../routes';

export default function StudentBatchesPage() {
  const navigate = useNavigate();

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['student-batches'],
    queryFn: listStudentBatches,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load batches.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Batches</h1>
        <p className="mt-0.5 text-sm text-slate-500">Batches you are enrolled in.</p>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <svg className="mb-4 h-10 w-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-base font-semibold text-slate-600">Not enrolled in any batch</p>
          <p className="mt-1 text-sm text-slate-400">Your teacher will add you to a batch.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => navigate(ROUTES.STUDENT_BATCH(batch.id))}
              className="group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <svg className="h-5 w-5 text-brand-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">{batch.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Teacher: {batch.teacherUsername}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span>{batch.studentCount} student{batch.studentCount !== 1 ? 's' : ''}</span>
                <span>{batch.testCount} test{batch.testCount !== 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
