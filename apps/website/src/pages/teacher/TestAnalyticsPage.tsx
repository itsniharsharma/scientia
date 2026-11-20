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
  Cell,
} from 'recharts';
import { getTestAnalytics } from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import { useThemeStore } from '../../store/theme.store';
import type {
  IntegrityIncidentType,
  IntegritySummaryDto,
  TestAnalyticsStudentDto,
} from '../../types/test';

// ─── Integrity flags ──────────────────────────────────────────────────────────

const FLAG = '⚑';

const INCIDENT_LABEL: Record<IntegrityIncidentType, string> = {
  TAB_HIDDEN: 'Switched tab or app',
  PAGE_EXIT: 'Closed or left the exam page',
  FOCUS_LOST: 'Clicked outside the exam window',
  SCREENSHOT_KEY: 'Pressed a screenshot key',
};

const NO_INCIDENTS: IntegritySummaryDto = {
  flagged: false,
  tabSwitches: 0,
  pageExits: 0,
  focusLosses: 0,
  screenshotAttempts: 0,
  timeAwaySeconds: 0,
  incidents: [],
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function incidentDuration(type: IntegrityIncidentType, seconds: number | null): string {
  if (type === 'SCREENSHOT_KEY') return '';
  return seconds === null ? 'did not return' : `away ${formatDuration(seconds)}`;
}

// e.g. ["2 tab/app switches", "1 screenshot key"]
function integrityBreakdown(i: IntegritySummaryDto): string[] {
  const parts: [number, string, string][] = [
    [i.tabSwitches, 'tab/app switch', 'tab/app switches'],
    [i.pageExits, 'page exit', 'page exits'],
    [i.focusLosses, 'focus loss', 'focus losses'],
    [i.screenshotAttempts, 'screenshot key', 'screenshot keys'],
  ];
  return parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
}

type ChartDatum = TestAnalyticsStudentDto & { flagMark: string };

interface TooltipColors {
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  flag: string;
}

function ScoreTooltip({
  active,
  payload,
  colors,
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
  colors: TooltipColors;
}) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  const { integrity } = d;
  return (
    <div
      style={{
        border: `1px solid ${colors.tooltipBorder}`,
        borderRadius: '10px',
        fontSize: '13px',
        padding: '8px 12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        background: colors.tooltipBg,
        color: colors.tooltipText,
        maxWidth: 260,
      }}
    >
      <p style={{ fontWeight: 600 }}>{d.username}</p>
      <p>Score: {d.score}</p>
      {integrity.flagged && (
        <div style={{ color: colors.flag, marginTop: 4 }}>
          <p style={{ fontWeight: 600 }}>{FLAG} Flagged</p>
          {integrityBreakdown(integrity).map((line) => (
            <p key={line}>{line}</p>
          ))}
          {integrity.timeAwaySeconds > 0 && <p>Time away: {formatDuration(integrity.timeAwaySeconds)}</p>}
        </div>
      )}
    </div>
  );
}

function FlaggedStudents({ students }: { students: TestAnalyticsStudentDto[] }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-900/50 dark:bg-slate-800/60">
      <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        <span className="text-red-600 dark:text-red-400">{FLAG}</span> Flagged Students
      </h2>
      <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
        Recorded while the test was in progress. Phones do not tell web pages about the hardware
        screenshot buttons, so a mobile screenshot shows up here once the student leaves the exam
        to use it.
      </p>
      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {students.map((s) => (
          <li key={s.username} className="py-3">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{s.username}</span>
                <span className="text-red-700 dark:text-red-400">
                  {integrityBreakdown(s.integrity).join(' · ')}
                </span>
                {s.integrity.timeAwaySeconds > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDuration(s.integrity.timeAwaySeconds)} away in total
                  </span>
                )}
              </summary>
              <ol className="mt-2 space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-300">
                {s.integrity.incidents.map((i) => (
                  <li key={`${i.at}-${i.type}`} className="flex flex-wrap gap-x-2">
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">
                      {new Date(i.at).toLocaleTimeString()}
                    </span>
                    <span>{INCIDENT_LABEL[i.type]}</span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {incidentDuration(i.type, i.durationSeconds)}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  const { test, summary } = data;
  // Analytics cached before integrity tracking shipped have no `integrity`.
  const students: ChartDatum[] = data.students.map((s) => {
    const integrity = s.integrity ?? NO_INCIDENTS;
    return { ...s, integrity, flagMark: integrity.flagged ? FLAG : '' };
  });
  const hasSubmissions = students.length > 0;
  const flaggedStudents = students.filter((s) => s.integrity.flagged);
  const flaggedNames = new Set(flaggedStudents.map((s) => s.username));

  // recharts renders via inline SVG attributes, not Tailwind classes — these
  // need to switch by hand based on the current theme.
  const chartColors = isDark
    ? { grid: '#334155', axisLine: '#475569', tick: '#94a3b8', tooltipBg: '#1e293b', tooltipBorder: '#334155', tooltipText: '#e2e8f0', bar: '#60a5fa', label: '#f1f5f9', cursor: '#1e293b', flag: '#f87171' }
    : { grid: '#f1f5f9', axisLine: '#e2e8f0', tick: '#64748b', tooltipBg: '#ffffff', tooltipBorder: '#e2e8f0', tooltipText: '#0f172a', bar: '#1d4ed8', label: '#1e293b', cursor: '#f8fafc', flag: '#dc2626' };

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
            {flaggedStudents.length > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {' · '}
                {FLAG} {flaggedStudents.length} flagged
              </span>
            )}
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
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Student Scores</h2>
          {flaggedStudents.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {FLAG} Flagged — switched tab or app, left the exam window or pressed a screenshot key
            </p>
          )}
        </div>

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
                tickFormatter={(name: string) => (flaggedNames.has(name) ? `${FLAG} ${name}` : name)}
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
                content={<ScoreTooltip colors={chartColors} />}
              />
              <Bar dataKey="score" fill={chartColors.bar} radius={[4, 4, 0, 0]}>
                {students.map((s) => (
                  <Cell key={s.username} fill={s.integrity.flagged ? chartColors.flag : chartColors.bar} />
                ))}
                <LabelList dataKey="score" position="top" style={{ fontSize: 12, fill: chartColors.label, fontWeight: 600 }} />
                <LabelList dataKey="flagMark" position="top" offset={22} style={{ fontSize: 15, fill: chartColors.flag, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {flaggedStudents.length > 0 && <FlaggedStudents students={flaggedStudents} />}
    </div>
  );
}
