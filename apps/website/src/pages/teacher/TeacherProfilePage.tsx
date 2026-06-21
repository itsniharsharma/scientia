import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';

interface TeacherProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

async function getTeacherProfile(): Promise<TeacherProfile> {
  const res = await api.get<TeacherProfile>('/teacher/profile');
  return res.data;
}

export default function TeacherProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: getTeacherProfile,
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
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Profile</h1>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-xl font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{data.username}</p>
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {data.role}
            </span>
          </div>
        </div>

        <dl className="mt-4 space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Username</dt>
            <dd className="text-sm font-medium text-slate-800">{data.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="text-sm font-medium text-slate-800">{data.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Member since</dt>
            <dd className="text-sm font-medium text-slate-800">{joined}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
