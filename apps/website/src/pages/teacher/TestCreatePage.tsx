import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchSubjects,
  fetchChaptersBySubject,
  fetchTopicsByChapter,
  generateTest,
} from '../../lib/tests.api';
import { ROUTES } from '../../routes';
import type { SubjectOption, ChapterOption, TopicOption } from '../../types/test';

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  'Test Name',
  'Subject',
  'Chapters',
  'Topics',
  'Questions',
  'Duration',
  'Schedule',
  'Generate',
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Step {current} of {total}
        </span>
        <span className="text-xs text-slate-400">{STEPS[current - 1]}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-brand-700 transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step layout ─────────────────────────────────────────────────────────────

function StepCard({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  loading = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="mb-8">{children}</div>
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TestCreatePage() {
  const navigate = useNavigate();
  // batchId is optional — present when navigating from /teacher/batches/:batchId/tests/new
  const { batchId } = useParams<{ batchId?: string }>();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [testName, setTestName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null);
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [scheduledAt, setScheduledAt] = useState('');

  // Data fetching
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
    enabled: step === 2,
  });

  const { data: chapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapters', selectedSubject?.id],
    queryFn: () => fetchChaptersBySubject(selectedSubject!.id),
    enabled: !!selectedSubject && step === 3,
  });

  const chapterTopicQueries = useQuery({
    queryKey: ['topics', selectedChapterIds],
    queryFn: async (): Promise<TopicOption[]> => {
      if (!selectedChapterIds.length) return [];
      const results = await Promise.all(selectedChapterIds.map(fetchTopicsByChapter));
      return results.flat();
    },
    enabled: selectedChapterIds.length > 0 && step === 4,
  });
  const topics = chapterTopicQueries.data ?? [];

  const generateMutation = useMutation({
    mutationFn: generateTest,
    onSuccess: (data) => {
      if (batchId) {
        navigate(ROUTES.TEACHER_BATCH(batchId));
      } else {
        navigate(ROUTES.TEACHER_TEST_REVIEW(data.id));
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to generate test. Please try again.';
      setError(msg);
    },
  });

  const next = () => {
    setError(null);
    setStep((s) => s + 1);
  };
  const back = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const toggleId = (id: string, list: string[], setter: (l: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleGenerate = () => {
    if (!selectedSubject) return;
    setError(null);
    generateMutation.mutate({
      name: testName,
      subjectId: selectedSubject.id,
      topicIds: selectedTopicIds,
      questionCount,
      durationMinutes,
      scheduledAt: new Date(scheduledAt).toISOString(),
      ...(batchId ? { batchId } : {}),
    });
  };

  const backTarget = batchId ? ROUTES.TEACHER_BATCH(batchId) : ROUTES.TEACHER_TESTS;
  const backLabel = batchId ? '← Back to Batch' : '← Back to All Tests';

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-700 focus:ring-offset-1 placeholder:text-slate-400';

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => navigate(backTarget)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          {backLabel}
        </button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Generate New Test
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <StepIndicator current={step} total={8} />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Test Name */}
        {step === 1 && (
          <StepCard
            title="Name your test"
            subtitle="This will appear on the test paper."
            onNext={next}
            nextDisabled={testName.trim().length < 1}
          >
            <input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g. Hydrocarbons #01"
              className={inputClass}
              autoFocus
            />
          </StepCard>
        )}

        {/* Step 2: Subject */}
        {step === 2 && (
          <StepCard
            title="Select a subject"
            onBack={back}
            onNext={next}
            nextDisabled={!selectedSubject}
          >
            {subjectsLoading && <p className="text-sm text-slate-400">Loading subjects...</p>}
            <div className="flex flex-col gap-2">
              {(subjects ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSubject(s);
                    setSelectedChapterIds([]);
                    setSelectedTopicIds([]);
                  }}
                  className={[
                    'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                    selectedSubject?.id === s.id
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {s.name}
                  {selectedSubject?.id === s.id && (
                    <svg className="h-4 w-4 text-brand-700" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {/* Step 3: Chapters */}
        {step === 3 && (
          <StepCard
            title="Select chapters"
            subtitle="Topics from these chapters will be available for question selection."
            onBack={back}
            onNext={next}
            nextDisabled={selectedChapterIds.length === 0}
          >
            {chaptersLoading && <p className="text-sm text-slate-400">Loading chapters...</p>}
            <div className="flex flex-col gap-2">
              {(chapters ?? []).map((c: ChapterOption) => (
                <label
                  key={c.id}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                    selectedChapterIds.includes(c.id)
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={selectedChapterIds.includes(c.id)}
                    onChange={() => {
                      toggleId(c.id, selectedChapterIds, (ids) => {
                        setSelectedChapterIds(ids);
                        setSelectedTopicIds([]);
                      });
                    }}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      selectedChapterIds.includes(c.id)
                        ? 'border-brand-700 bg-brand-700'
                        : 'border-slate-300',
                    ].join(' ')}
                  >
                    {selectedChapterIds.includes(c.id) && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M8.5 2.5L4 7 1.5 4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {c.name}
                </label>
              ))}
            </div>
          </StepCard>
        )}

        {/* Step 4: Topics */}
        {step === 4 && (
          <StepCard
            title="Select topics"
            subtitle="Questions will be drawn from these topics."
            onBack={back}
            onNext={next}
            nextDisabled={selectedTopicIds.length === 0}
          >
            {chapterTopicQueries.isLoading && (
              <p className="text-sm text-slate-400">Loading topics...</p>
            )}
            <div className="flex flex-col gap-2">
              {topics.map((t: TopicOption) => (
                <label
                  key={t.id}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                    selectedTopicIds.includes(t.id)
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={selectedTopicIds.includes(t.id)}
                    onChange={() => toggleId(t.id, selectedTopicIds, setSelectedTopicIds)}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      selectedTopicIds.includes(t.id)
                        ? 'border-brand-700 bg-brand-700'
                        : 'border-slate-300',
                    ].join(' ')}
                  >
                    {selectedTopicIds.includes(t.id) && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M8.5 2.5L4 7 1.5 4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {t.name}
                </label>
              ))}
            </div>
          </StepCard>
        )}

        {/* Step 5: Question count */}
        {step === 5 && (
          <StepCard
            title="Number of questions"
            subtitle="How many questions should this test contain?"
            onBack={back}
            onNext={next}
            nextDisabled={questionCount < 1}
          >
            <input
              type="number"
              min={1}
              max={200}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-slate-400">
              The algorithm will select the best-scored questions from your chosen topics.
            </p>
          </StepCard>
        )}

        {/* Step 6: Duration */}
        {step === 6 && (
          <StepCard
            title="Test duration"
            subtitle="Total time allowed for students to complete the test."
            onBack={back}
            onNext={next}
            nextDisabled={durationMinutes < 5}
          >
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(Math.max(5, parseInt(e.target.value) || 5))
                }
                className={`${inputClass} max-w-[120px]`}
              />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
            <div className="mt-3 flex gap-2">
              {[30, 45, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => setDurationMinutes(m)}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                    durationMinutes === m
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {m} min
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {/* Step 7: Schedule */}
        {step === 7 && (
          <StepCard
            title="Schedule the test"
            subtitle="When will this test be available to students?"
            onBack={back}
            onNext={next}
            nextDisabled={!scheduledAt}
          >
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
            />
          </StepCard>
        )}

        {/* Step 8: Review & Generate */}
        {step === 8 && (
          <StepCard
            title="Review & Generate"
            subtitle="Everything look good? Click generate to create your test."
            onBack={back}
            onNext={handleGenerate}
            nextLabel="Generate Test"
            loading={generateMutation.isPending}
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
              {[
                ['Test Name', testName],
                ['Subject', selectedSubject?.name ?? ''],
                ['Chapters', `${selectedChapterIds.length} selected`],
                ['Topics', `${selectedTopicIds.length} selected`],
                ['Questions', String(questionCount)],
                ['Duration', `${durationMinutes} minutes`],
                [
                  'Scheduled',
                  scheduledAt
                    ? new Date(scheduledAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—',
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </StepCard>
        )}
      </div>
    </div>
  );
}
