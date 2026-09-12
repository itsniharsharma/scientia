import { useQuery } from '@tanstack/react-query';
import { getStudentProfile } from '../../lib/student.api';
import { getMyStudentOrganisations } from '../../lib/organisations.api';

export default function StudentProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfile,
  });

  const { data: organisations = [] } = useQuery({
    queryKey: ['my-student-organisations'],
    queryFn: getMyStudentOrganisations,
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
        Failed to load profile.
      </div>
    );
  }

  const initial = data.username.charAt(0).toUpperCase();
  const joined = new Date(data.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-bold text-white dark:bg-brand-600">
            {initial}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{data.fullName}</p>
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
              {data.role}
            </span>
          </div>
        </div>

        <dl className="mt-4 space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Username</dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Full Name</dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Phone</dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.phone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Role</dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{data.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Member since</dt>
            <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{joined}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Enrolled Organisations</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          Assigned by your teacher. Contact them to change your organisation.
        </p>
        {organisations.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
            You are not part of any organisation yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {organisations.map((org) => (
              <li key={org.organisationId} className="py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100">
                {org.organisationName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
