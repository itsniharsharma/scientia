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
  LabelList,
} from 'recharts';
import { getTestAnalytics } from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import { useThemeStore } from '../../store/theme.store';

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
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center dark:border-slate-800 dark:bg-slate-800/60">
      <p className={`text-3xl font-bold ${accent ? 'text-brand-700 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TestAnalyticsPage() {
  const { testId } = useParams<{ testId: string }>();
  const isDark = useThemeStore((s) => s.theme === 'dark');

  const { data, isLoading, error } = useQuery({
    queryKey: ['test-analytics', testId],
    queryFn: () => getTestAnalytics(testId!),
    enabled: !!testId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm dark:text-slate-500">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    const raw = (error as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
    const msg = typeof raw === 'string' ? raw : 'Could not load analytics.';
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
        {msg}
      </div>
    );
  }

  if (!data) return null;

  const { test, summary, students } = data;
  const hasSubmissions = students.length > 0;

  // recharts renders via inline SVG attributes, not Tailwind classes — these
  // need to switch by hand based on the current theme.
  const chartColors = isDark
    ? { grid: '#334155', axisLine: '#475569', tick: '#94a3b8', tooltipBg: '#1e293b', tooltipBorder: '#334155', tooltipText: '#e2e8f0', bar: '#60a5fa', label: '#f1f5f9', cursor: '#1e293b' }
    : { grid: '#f1f5f9', axisLine: '#e2e8f0', tick: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a', bar: '#1d4ed8', label: '#1e293b', cursor: '#f8fafc' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 dark:text-slate-500">
            Test Analytics
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{test.name}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasSubmissions
              ? `${students.length} submission${students.length === 1 ? '' : 's'}`
              : 'No submissions yet'}
          </p>
        </div>
        <Link
          to={ROUTES.TEACHER_TESTS}
          className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800/60">
        <h2 className="text-base font-semibold text-slate-800 mb-6 dark:text-slate-100">Student Scores</h2>

        {!hasSubmissions ? (
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
            <p className="text-sm text-slate-400 dark:text-slate-500">No student submissions yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={students}
              margin={{ top: 24, right: 16, left: 0, bottom: 40 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="username"
                tick={{ fontSize: 12, fill: chartColors.tick }}
                angle={-35}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={{ stroke: chartColors.axisLine }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: chartColors.tick }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: chartColors.cursor }}
                contentStyle={{
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  padding: '8px 12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  background: chartColors.tooltipBg,
                  color: chartColors.tooltipText,
                }}
                formatter={(value) => [value, 'Score']}
              />
              <Bar dataKey="score" fill={chartColors.bar} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="score" position="top" style={{ fontSize: 12, fill: chartColors.label, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
