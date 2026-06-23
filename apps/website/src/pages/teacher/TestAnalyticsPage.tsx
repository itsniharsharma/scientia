import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getTestAnalytics } from '../../lib/tests.api';
import { ROUTES } from '../../routes';

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
      <p className={`text-3xl font-bold ${accent ? 'text-brand-700' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TestAnalyticsPage() {
  const { testId } = useParams<{ testId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['test-analytics', testId],
    queryFn: () => getTestAnalytics(testId!),
    enabled: !!testId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    const msg = typeof raw === 'string' ? raw : 'Could not load analytics.';
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {msg}
      </div>
    );
  }

  if (!data) return null;

  const { test, summary, students } = data;
  const hasSubmissions = students.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Test Analytics
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{test.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {hasSubmissions
              ? `${students.length} submission${students.length === 1 ? '' : 's'}`
              : 'No submissions yet'}
          </p>
        </div>
        <Link
          to={ROUTES.TEACHER_TESTS}
          className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← My Tests
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Highest Score"
          value={summary.highestScore !== null ? summary.highestScore : '—'}
          accent
        />
        <StatCard
          label="Average Score"
          value={summary.averageScore !== null ? summary.averageScore : '—'}
        />
        <StatCard
          label="Lowest Score"
          value={summary.lowestScore !== null ? summary.lowestScore : '—'}
        />
      </div>

      {/* Bar chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-6">Student Scores</h2>

        {!hasSubmissions ? (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
            <p className="text-sm text-slate-400">No student submissions yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={students}
              margin={{ top: 4, right: 16, left: 0, bottom: 40 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="username"
                tick={{ fontSize: 12, fill: '#64748b' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '13px',
                  padding: '8px 12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
                formatter={(value) => [value, 'Score']}
              />
              <Bar dataKey="score" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
