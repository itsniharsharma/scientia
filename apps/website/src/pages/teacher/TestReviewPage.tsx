import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  getTest,
  updateTestQuestion,
  deleteTestQuestion,
  reorderTestQuestions,
  getReplacementPool,
  addReplacementQuestion,
} from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import type { TestQuestionDto, TestOptionSnapshot, ReplacementPoolQuestion } from '../../types/test';
import { QuestionEditor } from '../../components/QuestionEditor';
import { QuestionContent } from '../../components/QuestionContent';

// ─── Question edit card ───────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onSave,
  onDelete,
}: {
  question: TestQuestionDto;
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (data: { questionText?: string; optionsJson?: TestOptionSnapshot[] }) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editText, setEditText] = useState(question.questionText ?? '');
  const [editOptions, setEditOptions] = useState<TestOptionSnapshot[]>(question.optionsJson);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      questionText: editText || undefined,
      optionsJson: editOptions.length ? editOptions : undefined,
    });
    setSaving(false);
    setExpanded(false);
  };

  const setOptionText = (optId: string, text: string) => {
    setEditOptions((opts) => opts.map((o) => (o.id === optId ? { ...o, optionText: text } : o)));
  };

  const toggleCorrect = (optId: string) => {
    setEditOptions((opts) =>
      opts.map((o) =>
        question.questionType === 'SINGLE_CHOICE'
          ? { ...o, isCorrect: o.id === optId }
          : o.id === optId
          ? { ...o, isCorrect: !o.isCorrect }
          : o,
      ),
    );
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-30"
            title="Move up"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-300 hover:text-slate-600 disabled:opacity-30"
            title="Move down"
          >
            ▼
          </button>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">
            {question.questionText
              ? question.questionText
              : question.questionImageUrl
                ? <em className="text-slate-400">Image-only question</em>
                : question.latexContent
                  ? <em className="text-slate-400">LaTeX-only question</em>
                  : <em className="text-slate-400">Empty question</em>}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {question.questionType.replace('_', ' ')}
            {question.questionImageUrl && ' · has image'}
            {question.latexContent && ' · has LaTeX'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {expanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-5 bg-slate-50">
          <div className="flex flex-col gap-4">
            {(question.questionImageUrl || question.latexContent) && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Question Preview
                </label>
                <QuestionContent
                  questionText={null}
                  questionImageUrl={question.questionImageUrl}
                  latexContent={question.latexContent}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Question Text
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-700 focus:ring-offset-1 resize-none"
              />
            </div>

            {editOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Options{' '}
                  <span className="normal-case font-normal text-slate-400">
                    (click checkbox to mark correct)
                  </span>
                </label>
                <div className="flex flex-col gap-2">
                  {editOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCorrect(opt.id)}
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                          opt.isCorrect
                            ? 'border-green-600 bg-green-600'
                            : 'border-slate-300 bg-white',
                        ].join(' ')}
                        title="Toggle correct"
                      >
                        {opt.isCorrect && (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <input
                        value={opt.optionText ?? ''}
                        onChange={(e) => setOptionText(opt.id, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-700 focus:ring-offset-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExpanded(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create question modal ────────────────────────────────────────────────────

function CreateQuestionModal({
  testId,
  subjectId,
  onClose,
  onCreated,
}: {
  testId: string;
  subjectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h3 className="text-base font-bold text-slate-900">New Question</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-slate-400 hover:text-slate-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body — QuestionEditor owns form state, validation, submit, and footer buttons */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <QuestionEditor
            testId={testId}
            subjectId={subjectId}
            onCancel={onClose}
            onCreated={onCreated}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Replacement modal ────────────────────────────────────────────────────────

function ReplacementModal({
  testId,
  insertAtPosition,
  onClose,
  onAdded,
}: {
  testId: string;
  insertAtPosition: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const { data: pool, isLoading } = useQuery({
    queryKey: ['replacementPool', testId],
    queryFn: () => getReplacementPool(testId),
  });
  const addMutation = useMutation({
    mutationFn: (originalQuestionId: string) =>
      addReplacementQuestion(testId, { originalQuestionId, position: insertAtPosition }),
    onSuccess: onAdded,
  });

  const filtered = (pool ?? []).filter(
    (q) =>
      !search ||
      q.questionText?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Add Replacement Question</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {isLoading && (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">Loading questions...</p>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="px-6 py-8 text-sm text-slate-400 text-center">
              No available questions found.
            </p>
          )}
          {filtered.map((q: ReplacementPoolQuestion) => (
            <div key={q.id} className="flex items-start gap-4 px-6 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-relaxed">
                  {q.questionText ?? <em className="text-slate-400">Image-only question</em>}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {q.type.replace('_', ' ')} &middot; used {q.appearanceCount}×
                </p>
              </div>
              <button
                onClick={() => addMutation.mutate(q.id)}
                disabled={addMutation.isPending}
                className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TestReviewPage() {
  const { testId } = useParams<{ testId: string }>();
  const queryClient = useQueryClient();
  const [showReplacement, setShowReplacement] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => getTest(testId!),
    enabled: !!testId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['test', testId] });

  const updateMutation = useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string;
      data: { questionText?: string; optionsJson?: TestOptionSnapshot[] };
    }) => updateTestQuestion(testId!, questionId, data),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => deleteTestQuestion(testId!, questionId),
    onSuccess: refresh,
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: string; position: number }[]) =>
      reorderTestQuestions(testId!, order),
    onSuccess: refresh,
  });

  const handleMoveUp = (questions: TestQuestionDto[], index: number) => {
    if (index === 0) return;
    const order = questions.map((q, i) => ({
      id: q.id,
      position: i === index ? index : i === index - 1 ? index + 1 : i + 1,
    }));
    reorderMutation.mutate(order);
  };

  const handleMoveDown = (questions: TestQuestionDto[], index: number) => {
    if (index === questions.length - 1) return;
    const order = questions.map((q, i) => ({
      id: q.id,
      position: i === index ? index + 2 : i === index + 1 ? index + 1 : i + 1,
    }));
    reorderMutation.mutate(order);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading test...
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Test not found or failed to load.
      </div>
    );
  }

  const sortedQuestions = [...test.questions].sort((a, b) => a.position - b.position);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to={ROUTES.TEACHER_TEST(testId!)}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← {test.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Review Questions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {sortedQuestions.length} questions &middot; edits only affect this test, not the question bank.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
          >
            + Create Question
          </button>
          <button
            onClick={() => setShowReplacement(true)}
            className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
          >
            + Add from Bank
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-3">
        {sortedQuestions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            totalCount={sortedQuestions.length}
            onMoveUp={() => handleMoveUp(sortedQuestions, i)}
            onMoveDown={() => handleMoveDown(sortedQuestions, i)}
            onSave={(data) => updateMutation.mutateAsync({ questionId: q.id, data })}
            onDelete={() => {
              if (window.confirm('Remove this question from the test?')) {
                deleteMutation.mutate(q.id);
              }
            }}
          />
        ))}
      </div>

      {/* Create question modal */}
      {showCreate && (
        <CreateQuestionModal
          testId={testId!}
          subjectId={test.subjectId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}

      {/* Replacement modal */}
      {showReplacement && (
        <ReplacementModal
          testId={testId!}
          insertAtPosition={sortedQuestions.length + 1}
          onClose={() => setShowReplacement(false)}
          onAdded={() => {
            setShowReplacement(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
