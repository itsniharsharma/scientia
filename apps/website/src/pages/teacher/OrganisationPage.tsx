import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyOrganisations,
  listOrganisationStudents,
  assignStudentToOrganisation,
} from '../../lib/organisations.api';

function AssignStudentRow({ organisationId }: { organisationId: string }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => assignStudentToOrganisation(organisationId, username.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organisation-students', organisationId] });
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
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
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
        {mutation.isPending ? '…' : 'Assign'}
      </button>
    </form>
  );
}

export default function OrganisationPage() {
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const { data: organisations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['my-organisations'],
    queryFn: getMyOrganisations,
  });

  const activeOrgId = selectedOrgId || organisations[0]?.organisationId || '';

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['organisation-students', activeOrgId],
    queryFn: () => listOrganisationStudents(activeOrgId),
    enabled: !!activeOrgId,
  });

  if (loadingOrgs) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organisation</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Assign existing students to an organisation you belong to.
        </p>
      </div>

      {organisations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">You are not a member of any organisation yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Organisation</label>
            <select
              value={activeOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-brand-500 focus:ring-2 focus:border-transparent dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {organisations.map((org) => (
                <option key={org.organisationId} value={org.organisationId}>
                  {org.organisationName}
                </option>
              ))}
            </select>
          </div>

          <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Assign Student</h2>
          <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
            Add an existing student to this organisation by their username.
          </p>
          <AssignStudentRow organisationId={activeOrgId} />

          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Students in this organisation
          </h3>
          {loadingStudents ? (
            <div className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</div>
          ) : students.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">No students assigned yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {students.map((s) => (
                <div key={s.studentId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{s.username}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{s.fullName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
