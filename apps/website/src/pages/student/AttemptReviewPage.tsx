import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getAttemptReview } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';
import type { ReviewQuestion, ReviewOption } from '../../types/attempt';
import { QuestionContent } from '../../components/QuestionContent';
import { OptionContent } from '../../components/OptionContent';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'correct' | 'wrong' | 'skipped' }) {
  if (status === 'correct') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        ✓ Correct
      </span>
    );
  }
  if (status === 'wrong') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
        ✗ Wrong
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
      ○ Skipped
    </span>
  );
}

// ─── Option row ───────────────────────────────────────────────────────────────

function OptionRow({ opt, index }: { opt: ReviewOption; index: number }) {
  const letter = String.fromCharCode(65 + index); // A, B, C, D

  let classes =
    'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors';
  let icon: string | null = null;

  if (opt.wasSelected && opt.isCorrect) {
    classes += ' border-green-300 bg-green-50 text-green-800';
    icon = '✓';
  } else if (opt.wasSelected && !opt.isCorrect) {
    classes += ' border-red-300 bg-red-50 text-red-700';
    icon = '✗';
  } else if (!opt.wasSelected && opt.isCorrect) {
    classes += ' border-green-200 bg-green-50/60 text-green-800';
    icon = '✓';
  } else {
    classes += ' border-slate-200 bg-white text-slate-600';
  }

  return (
    <div className={classes}>
      <span className="shrink-0 font-semibold w-5">{letter}.</span>
      <OptionContent
        optionText={opt.optionText}
        optionImageUrl={opt.optionImageUrl}
        latexContent={opt.latexContent}
        className="flex-1"
      />
      {icon && (
        <span
          className={[
            'shrink-0 font-bold text-base',
            opt.isCorrect ? 'text-green-600' : 'text-red-500',
          ].join(' ')}
        >
          {icon}
        </span>
      )}
    </div>
  );
}

// ─── Answer summary footer ────────────────────────────────────────────────────

function AnswerSummary({ question }: { question: ReviewQuestion }) {
  const { questionType, selectedAnswer, correctAnswer, options } = question;

  if (questionType === 'INTEGER') {
    const selectedVal =
      selectedAnswer?.type === 'integer' ? selectedAnswer.value : null;
    const correctVal =
      correctAnswer.type === 'integer' ? correctAnswer.value : null;

    return (
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-50 pt-4">
        <FooterItem
          label="Your Answer"
          value={selectedVal !== null ? String(selectedVal) : 'Not Answered'}
          muted={selectedVal === null}
        />
        <FooterItem label="Correct Answer" value={correctVal !== null ? String(correctVal) : '—'} />
      </div>
    );
  }

  // SINGLE_CHOICE or MULTI_CHOICE
  const selectedIds =
    selectedAnswer?.type === 'choice' ? selectedAnswer.optionIds : [];
  const correctIds =
    correctAnswer.type === 'choice' ? correctAnswer.optionIds : [];

  const optionLabel = (id: string) => {
    const idx = options.findIndex((o) => o.id === id);
    const opt = options[idx];
    if (idx < 0) return id;
    const letter = String.fromCharCode(65 + idx);
    const label = opt?.optionText ?? (opt?.optionImageUrl ? '[Image]' : opt?.latexContent ? '[LaTeX]' : '');
    return `${letter}. ${label}`;
  };

  const yourAnswerText =
    selectedIds.length === 0
      ? 'Not Answered'
      : selectedIds.map(optionLabel).join(', ');

  const correctAnswerText = correctIds.map(optionLabel).join(', ');

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-50 pt-4">
      <FooterItem
        label="Your Answer"
        value={yourAnswerText}
        muted={selectedIds.length === 0}
      />
      <FooterItem label="Correct Answer" value={correctAnswerText} />
    </div>
  );
}

function FooterItem({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${muted ? 'text-slate-400 italic' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────

function QuestionCard({ question, number }: { question: ReviewQuestion; number: number }) {
  return (
    <div
      className={[
        'rounded-2xl border bg-white p-6 shadow-sm',
        question.status === 'correct'
          ? 'border-green-100'
          : question.status === 'wrong'
            ? 'border-red-100'
            : 'border-slate-100',
      ].join(' ')}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white shrink-0">
            {number}
          </span>
          <span className="text-xs text-slate-400 capitalize">
            {question.questionType.toLowerCase().replace('_', ' ')}
          </span>
        </div>
        <StatusBadge status={question.status} />
      </div>

      <QuestionContent
        questionText={question.questionText}
        questionImageUrl={question.questionImageUrl}
        latexContent={question.latexContent}
        questionNumber={number}
        className="mb-4"
      />

      {/* Options (choice questions) */}
      {question.questionType !== 'INTEGER' && question.options.length > 0 && (
        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <OptionRow key={opt.id} opt={opt} index={i} />
          ))}
        </div>
      )}

      {/* Integer input display */}
      {question.questionType === 'INTEGER' && (
        <div className="flex gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-xs text-slate-400 mb-0.5">Your answer</p>
            <p className="text-lg font-bold text-slate-800">
              {question.selectedAnswer?.type === 'integer' && question.selectedAnswer.value !== null
                ? question.selectedAnswer.value
                : <span className="text-slate-400 font-normal italic">Not answered</span>}
            </p>
          </div>
          <div
            className={[
              'rounded-xl border px-5 py-3',
              question.status === 'correct'
                ? 'border-green-200 bg-green-50'
                : 'border-slate-200 bg-slate-50',
            ].join(' ')}
          >
            <p className="text-xs text-slate-400 mb-0.5">Correct answer</p>
            <p className="text-lg font-bold text-green-700">
              {question.correctAnswer.type === 'integer'
                ? question.correctAnswer.value
                : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Answer summary footer (choice questions only) */}
      {question.questionType !== 'INTEGER' && <AnswerSummary question={question} />}
    </div>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AttemptReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['attempt-review', attemptId],
    queryFn: () => getAttemptReview(attemptId!),
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading review...
      </div>
    );
  }

  if (error) {
    const msg =
      (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      'Could not load review.';
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {msg}
      </div>
    );
  }

  if (!data) return null;

  const { attempt, questions } = data;
  const total = questions.length;
  const maxScore = total * 4;
  const score = attempt.score ?? 0;
  const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;

  const scoreColor =
    percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Attempt Review
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {attempt.testName}
          </h1>
          {attempt.submittedAt && (
            <p className="mt-1 text-sm text-slate-400">
              Submitted{' '}
              {new Date(attempt.submittedAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <Link
          to={ROUTES.STUDENT_DASHBOARD}
          className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Score summary */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className={`text-4xl font-black ${scoreColor}`}>{score}</p>
            <p className="text-sm text-slate-400">out of {maxScore} · {percentage}%</p>
          </div>
          <div className="w-24 h-24 relative flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={percentage >= 70 ? '#16a34a' : percentage >= 40 ? '#ca8a04' : '#dc2626'}
                strokeWidth="3"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-sm font-bold ${scoreColor}`}>{percentage}%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SummaryStat label="Correct" value={attempt.correctCount ?? 0} color="text-green-600" />
          <SummaryStat label="Wrong" value={attempt.wrongCount ?? 0} color="text-red-600" />
          <SummaryStat label="Skipped" value={attempt.unattemptedCount ?? 0} color="text-slate-400" />
        </div>
      </div>

      {/* Filter legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-200" />
          Correct ({attempt.correctCount ?? 0})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          Wrong ({attempt.wrongCount ?? 0})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
          Skipped ({attempt.unattemptedCount ?? 0})
        </span>
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <QuestionCard key={q.id} question={q} number={i + 1} />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex gap-3 pt-2 pb-8">
        <Link
          to={ROUTES.STUDENT_DASHBOARD}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Dashboard
        </Link>
        <Link
          to={ROUTES.STUDENT_TESTS}
          className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors text-center"
        >
          All Tests
        </Link>
      </div>
    </div>
  );
}
