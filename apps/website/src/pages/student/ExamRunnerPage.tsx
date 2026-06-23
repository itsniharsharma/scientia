import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAttempt, saveResponses, submitAttempt } from '../../lib/attempts.api';
import { ROUTES } from '../../routes';
import type { AttemptWithDetailsDto, SelectedAnswer } from '../../types/attempt';
import type { TestQuestionDto, TestOptionSnapshot } from '../../types/test';
import { QuestionContent } from '../../components/QuestionContent';
import { OptionContent } from '../../components/OptionContent';

// ─── Local-storage crash recovery ────────────────────────────────────────────

const lsKey = (id: string) => `exam_state_${id}`;

interface LocalState {
  currentIndex: number;
  visitedIds: string[];
  markedIds: string[];
}

function loadLocalState(attemptId: string): LocalState {
  try {
    const raw = localStorage.getItem(lsKey(attemptId));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { currentIndex: 0, visitedIds: [], markedIds: [] };
}

function saveLocalState(attemptId: string, state: LocalState) {
  localStorage.setItem(lsKey(attemptId), JSON.stringify(state));
}

function clearLocalState(attemptId: string) {
  localStorage.removeItem(lsKey(attemptId));
}

// ─── Timer helpers ────────────────────────────────────────────────────────────

function calcRemaining(startedAt: string, durationMinutes: number): number {
  const endMs = new Date(startedAt).getTime() + durationMinutes * 60 * 1000;
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Answer helpers ───────────────────────────────────────────────────────────

function isAttempted(ans: SelectedAnswer | null): boolean {
  if (!ans) return false;
  if (ans.type === 'integer') return ans.value !== null;
  return ans.optionIds.length > 0;
}

// ─── Palette cell ─────────────────────────────────────────────────────────────

type QuestionState = 'NOT_VISITED' | 'VISITED' | 'ANSWERED' | 'MARKED';

function paletteClass(state: QuestionState, active: boolean): string {
  const base =
    'w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors border';
  if (active) return `${base} ring-2 ring-brand-700 ring-offset-1`;
  switch (state) {
    case 'ANSWERED':
      return `${base} bg-green-500 text-white border-green-500`;
    case 'MARKED':
      return `${base} bg-orange-400 text-white border-orange-400`;
    case 'VISITED':
      return `${base} bg-blue-100 text-blue-700 border-blue-200`;
    default:
      return `${base} bg-slate-100 text-slate-500 border-slate-200`;
  }
}

// ─── Question renderer ────────────────────────────────────────────────────────

function QuestionPanel({
  question,
  answer,
  onChange,
}: {
  question: TestQuestionDto;
  answer: SelectedAnswer | null;
  onChange: (ans: SelectedAnswer | null) => void;
}) {
  if (question.questionType === 'INTEGER') {
    const intVal =
      answer?.type === 'integer' ? (answer.value !== null ? String(answer.value) : '') : '';

    return (
      <div className="space-y-4">
        <QuestionContent
          questionText={question.questionText}
          questionImageUrl={question.questionImageUrl}
          latexContent={question.latexContent}
        />
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Enter your answer (integer):
          </label>
          <input
            type="number"
            value={intVal}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val === '') {
                onChange(null);
              } else {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed)) onChange({ type: 'integer', value: parsed });
              }
            }}
            className="w-40 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-1"
            placeholder="e.g. 42"
          />
        </div>
      </div>
    );
  }

  // SINGLE_CHOICE or MULTI_CHOICE
  const selectedIds: string[] =
    answer?.type === 'choice' ? answer.optionIds : [];

  const toggleOption = (optId: string) => {
    if (question.questionType === 'SINGLE_CHOICE') {
      if (selectedIds[0] === optId) {
        onChange(null); // deselect
      } else {
        onChange({ type: 'choice', optionIds: [optId] });
      }
    } else {
      // MULTI_CHOICE
      const next = selectedIds.includes(optId)
        ? selectedIds.filter((id) => id !== optId)
        : [...selectedIds, optId];
      onChange(next.length > 0 ? { type: 'choice', optionIds: next } : null);
    }
  };

  return (
    <div className="space-y-4">
      <QuestionContent
        questionText={question.questionText}
        questionImageUrl={question.questionImageUrl}
        latexContent={question.latexContent}
      />
      {question.questionType === 'MULTI_CHOICE' && (
        <p className="text-xs text-slate-400">Select all that apply</p>
      )}
      <div className="space-y-2.5">
        {(question.optionsJson as TestOptionSnapshot[])
          .sort((a, b) => a.position - b.position)
          .map((opt) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className={[
                  'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-brand-400 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50',
                ].join(' ')}
              >
                <div className="flex gap-2">
                  <span className="font-medium shrink-0">
                    {String.fromCharCode(64 + opt.position)}.
                  </span>
                  <OptionContent
                    optionText={opt.optionText}
                    optionImageUrl={opt.optionImageUrl}
                    latexContent={opt.latexContent}
                  />
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────

function SubmitModal({
  questions,
  responses,
  markedIds,
  submitting,
  onConfirm,
  onCancel,
}: {
  questions: TestQuestionDto[];
  responses: Map<string, SelectedAnswer | null>;
  markedIds: Set<string>;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const attempted = questions.filter((q) => isAttempted(responses.get(q.id) ?? null)).length;
  const marked = questions.filter((q) => markedIds.has(q.id)).length;
  const notAttempted = questions.length - attempted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl mx-4">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Submit Exam?</h2>
        <p className="text-sm text-slate-500 mb-6">
          Once submitted, you cannot make changes.
        </p>

        <div className="space-y-3 mb-6">
          <SumRow label="Attempted" value={attempted} color="text-green-700" />
          <SumRow label="Not Attempted" value={notAttempted} color="text-red-600" />
          <SumRow label="Marked for Review" value={marked} color="text-orange-500" />
          <SumRow label="Total Questions" value={questions.length} color="text-slate-700" />
        </div>

        {notAttempted > 0 && (
          <div className="mb-5 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-xs text-yellow-700">
            You have {notAttempted} unattempted question{notAttempted > 1 ? 's' : ''}. Unattempted questions score 0.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Review Again
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Confirm Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SumRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main ExamRunner ──────────────────────────────────────────────────────────

export function ExamRunnerPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<AttemptWithDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Core exam state
  const [responses, setResponses] = useState<Map<string, SelectedAnswer | null>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSaveRef = useRef<Set<string>>(new Set());
  // Stable ref so the autosave interval always calls the latest flush without restarting
  const flushPendingSaveRef = useRef<() => void>(() => {});

  // ── Load attempt on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!attemptId) return;

    getAttempt(attemptId)
      .then((data) => {
        if (data.status === 'SUBMITTED' || data.status === 'EXPIRED') {
          navigate(ROUTES.STUDENT_RESULT(attemptId), { replace: true });
          return;
        }

        const localState = loadLocalState(attemptId);

        // Restore responses from server
        const resMap = new Map<string, SelectedAnswer | null>();
        for (const q of data.questions) {
          const serverResp = data.responses.find((r) => r.testQuestionId === q.id);
          resMap.set(q.id, serverResp?.selectedAnswerJson ?? null);
        }

        setAttempt(data);
        setResponses(resMap);
        setCurrentIndex(Math.min(localState.currentIndex, data.questions.length - 1));
        setVisitedIds(new Set(localState.visitedIds));
        setMarkedIds(new Set(localState.markedIds));
        setTimeRemaining(calcRemaining(data.startedAt, data.test.durationMinutes));
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Failed to load exam. Please refresh.');
        setLoading(false);
      });
  }, [attemptId, navigate]);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!attempt || loading) return;

    countdownRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownRef.current!);
  }, [attempt, loading]);

  // ── 30-second autosave — started once, never restarted on answer changes ────
  useEffect(() => {
    if (!attempt || loading) return;

    autosaveTimerRef.current = setInterval(() => {
      flushPendingSaveRef.current();
    }, 30_000);

    return () => clearInterval(autosaveTimerRef.current!);
  }, [attempt, loading]);

  // ── Persist local state on index/visited/marked changes ─────────────────────
  useEffect(() => {
    if (!attemptId || loading) return;
    saveLocalState(attemptId, {
      currentIndex,
      visitedIds: Array.from(visitedIds),
      markedIds: Array.from(markedIds),
    });
  }, [currentIndex, visitedIds, markedIds, attemptId, loading]);

  // ── Mark current question as visited ────────────────────────────────────────
  useEffect(() => {
    if (!attempt || loading) return;
    const q = attempt.questions[currentIndex];
    if (q && !visitedIds.has(q.id)) {
      setVisitedIds((prev) => new Set([...prev, q.id]));
    }
  }, [currentIndex, attempt, loading]);

  // ─── Autosave flush ─────────────────────────────────────────────────────────
  const flushPendingSave = useCallback(() => {
    if (!attemptId || pendingSaveRef.current.size === 0) return;
    const ids = Array.from(pendingSaveRef.current);
    pendingSaveRef.current = new Set();

    const payload = ids.map((qId) => ({
      testQuestionId: qId,
      selectedAnswerJson: responses.get(qId) ?? null,
    }));

    saveResponses(attemptId, payload).catch(() => {
      // Re-queue on failure
      ids.forEach((id) => pendingSaveRef.current.add(id));
    });
  }, [attemptId, responses]);

  // Keep the ref in sync so the stable interval always calls the latest version
  flushPendingSaveRef.current = flushPendingSave;

  // ─── Answer change ───────────────────────────────────────────────────────────
  const handleAnswerChange = useCallback(
    (qId: string, answer: SelectedAnswer | null) => {
      setResponses((prev) => {
        const next = new Map(prev);
        next.set(qId, answer);
        return next;
      });
      pendingSaveRef.current.add(qId);
      // Immediate save on answer change
      if (attemptId) {
        saveResponses(attemptId, [{ testQuestionId: qId, selectedAnswerJson: answer }]).catch(
          () => {
            pendingSaveRef.current.add(qId);
          },
        );
      }
    },
    [attemptId],
  );

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (!attempt) return;
      flushPendingSave();
      setCurrentIndex(Math.max(0, Math.min(index, attempt.questions.length - 1)));
    },
    [attempt, flushPendingSave],
  );

  const handleToggleMark = () => {
    if (!attempt) return;
    const qId = attempt.questions[currentIndex].id;
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId) return;
    try {
      await flushPendingSave();
      await submitAttempt(attemptId);
      clearLocalState(attemptId);
      navigate(ROUTES.STUDENT_RESULT(attemptId), { replace: true });
    } catch {}
  }, [attemptId, navigate, flushPendingSave]);

  const handleConfirmSubmit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      flushPendingSave();
      await submitAttempt(attemptId);
      clearLocalState(attemptId);
      navigate(ROUTES.STUDENT_RESULT(attemptId), { replace: true });
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error;
      alert(typeof raw === 'string' ? raw : 'Submission failed. Please try again.');
      setSubmitting(false);
      setShowSubmit(false);
    }
  };

  // ─── Loading / error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white text-slate-400 text-sm">
        Loading exam...
      </div>
    );
  }

  if (loadError || !attempt) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 max-w-sm text-center">
          {loadError ?? 'Exam not found.'}
        </div>
      </div>
    );
  }

  const { questions } = attempt;
  const currentQ = questions[currentIndex];
  const currentAnswer = responses.get(currentQ.id) ?? null;
  const isMarked = markedIds.has(currentQ.id);

  const timerWarning = timeRemaining < 300;
  const timerCritical = timeRemaining < 60;

  // Compute palette state for each question
  const qState = (q: TestQuestionDto): QuestionState => {
    if (markedIds.has(q.id)) return 'MARKED';
    if (isAttempted(responses.get(q.id) ?? null)) return 'ANSWERED';
    if (visitedIds.has(q.id)) return 'VISITED';
    return 'NOT_VISITED';
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <h1 className="text-sm font-semibold text-slate-800 truncate max-w-xs">
          {attempt.test.name}
        </h1>
        <div
          className={[
            'flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-bold tabular-nums',
            timerCritical
              ? 'bg-red-100 text-red-700'
              : timerWarning
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-slate-100 text-slate-700',
          ].join(' ')}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(timeRemaining)}
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {/* Question header */}
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full bg-brand-700 px-3 py-0.5 text-xs font-bold text-white">
              Q{currentIndex + 1}
            </span>
            <span className="text-xs text-slate-400">
              {currentIndex + 1} / {questions.length}
            </span>
            <span className="ml-auto text-xs text-slate-400 capitalize">
              {currentQ.questionType.toLowerCase().replace('_', ' ')}
            </span>
          </div>

          {/* Question content */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex-1">
            <QuestionPanel
              question={currentQ}
              answer={currentAnswer}
              onChange={(ans) => handleAnswerChange(currentQ.id, ans)}
            />
          </div>

          {/* Action bar */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleMark}
              className={[
                'rounded-xl border px-4 py-2 text-xs font-semibold transition-colors',
                isMarked
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50',
              ].join(' ')}
            >
              {isMarked ? '★ Marked' : '☆ Mark for Review'}
            </button>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  className="rounded-xl bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800 transition-colors"
                >
                  Save & Next →
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmit(true)}
                  className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Question palette (sidebar) ── */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white p-4 overflow-y-auto">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Question Palette
          </h2>

          {/* Legend */}
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            <LegendItem color="bg-slate-100 border-slate-200" label="Not Visited" />
            <LegendItem color="bg-blue-100 border-blue-200" label="Visited" />
            <LegendItem color="bg-green-500 border-green-500" label="Answered" />
            <LegendItem color="bg-orange-400 border-orange-400" label="Marked" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                className={paletteClass(qState(q), i === currentIndex)}
                title={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowSubmit(true)}
              className="w-full rounded-xl bg-green-600 py-2.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* Submit modal */}
      {showSubmit && (
        <SubmitModal
          questions={questions}
          responses={responses}
          markedIds={markedIds}
          submitting={submitting}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3.5 h-3.5 rounded border ${color} shrink-0`} />
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}
