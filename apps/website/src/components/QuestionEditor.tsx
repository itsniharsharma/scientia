import { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch, Controller, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { createTestQuestionSchema } from '@scientia/validators';
import type { CreateTestQuestionInput } from '@scientia/validators';
import { fetchChaptersBySubject, fetchTopicsByChapter, createTestQuestion } from '../lib/tests.api';
import { ImageUpload } from './ImageUpload';

// Preprocess empty strings → undefined before schema validates (same pattern as admin)
const formSchema = z.preprocess((input) => {
  if (typeof input !== 'object' || input === null) return input;
  const d = input as Record<string, unknown>;
  const trimOrUndef = (v: unknown) =>
    typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
  return {
    ...d,
    questionText: trimOrUndef(d.questionText),
    questionImageUrl: trimOrUndef(d.questionImageUrl),
    latexContent: trimOrUndef(d.latexContent),
    options: Array.isArray(d.options)
      ? d.options.map((o: unknown) => {
          if (typeof o !== 'object' || o === null) return o;
          const opt = o as Record<string, unknown>;
          return {
            ...opt,
            optionText: trimOrUndef(opt.optionText),
            optionImageUrl: trimOrUndef(opt.optionImageUrl),
            latexContent: trimOrUndef(opt.latexContent),
          };
        })
      : d.options,
  };
}, createTestQuestionSchema);

const defaultOption = {
  position: 0,
  optionText: '',
  optionImageUrl: '',
  latexContent: '',
  isCorrect: false,
};

interface QuestionEditorProps {
  testId: string;
  subjectId: string;
  onCancel: () => void;
  onCreated: () => void;
}

export function QuestionEditor({ testId, subjectId, onCancel, onCreated }: QuestionEditorProps) {
  const [activeUploads, setActiveUploads] = useState(0);
  const [chapterId, setChapterId] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    trigger,
    formState: { errors, isValid },
  } = useForm<CreateTestQuestionInput>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      questionType: 'SINGLE_CHOICE',
      questionText: '',
      questionImageUrl: '',
      options: [{ ...defaultOption, isCorrect: true }],
      publishToQuestionBank: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const questionType = watch('questionType') ?? 'SINGLE_CHOICE';
  const publishToBank = watch('publishToQuestionBank') ?? false;
  const optionValues = useWatch({ control, name: 'options' }) ?? [];

  // Chapter → topic cascade (only fetched when publishing is on)
  const { data: chapters = [] } = useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => fetchChaptersBySubject(subjectId),
    enabled: publishToBank && !!subjectId,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['topics', chapterId],
    queryFn: () => fetchTopicsByChapter(chapterId),
    enabled: publishToBank && !!chapterId,
  });

  // Reset option isCorrect state when type changes
  useEffect(() => {
    if (questionType === 'SINGLE_CHOICE') {
      optionValues.forEach((_, i) => {
        setValue(`options.${i}.isCorrect`, i === 0, { shouldValidate: true });
      });
    }
    if (questionType === 'MULTI_CHOICE') {
      optionValues.forEach((_, i) => {
        setValue(`options.${i}.isCorrect`, false, { shouldValidate: true });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionType]);

  function handleSingleCorrect(correctIndex: number) {
    fields.forEach((_, i) => {
      setValue(`options.${i}.isCorrect`, i === correctIndex, { shouldValidate: true });
    });
  }

  function handleMultiCorrect(index: number, checked: boolean) {
    setValue(`options.${index}.isCorrect`, checked, { shouldValidate: true });
  }

  function addOption() {
    append({ position: fields.length, optionText: '', optionImageUrl: '', latexContent: '', isCorrect: false });
  }

  async function onSubmit(data: CreateTestQuestionInput) {
    try {
      await createTestQuestion(testId, {
        questionType: data.questionType,
        questionText: data.questionText,
        questionImageUrl: data.questionImageUrl,
        latexContent: data.latexContent,
        options: data.options,
        integerAnswer: data.integerAnswer,
        publishToQuestionBank: data.publishToQuestionBank,
        topicId: data.topicId,
      });
      reset();
      setChapterId('');
      onCreated();
    } catch (err) {
      setError('root', { message: 'Failed to create question. Please try again.' });
    }
  }

  // Two-button approach: each button explicitly sets publishToQuestionBank before submitting
  function createTestOnly() {
    setValue('publishToQuestionBank', false, { shouldValidate: false });
    void handleSubmit(onSubmit)();
  }

  function createAndPublish() {
    setValue('publishToQuestionBank', true, { shouldValidate: false });
    void handleSubmit(onSubmit)();
  }

  const isChoiceType = questionType === 'SINGLE_CHOICE' || questionType === 'MULTI_CHOICE';

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">

      {/* Question type */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-slate-700">Question type</p>
        <div className="flex gap-4">
          {(['SINGLE_CHOICE', 'MULTI_CHOICE', 'INTEGER'] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                value={t}
                {...register('questionType')}
                className="h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-700"
              />
              <span className="text-sm text-slate-700">
                {t === 'SINGLE_CHOICE' ? 'Single Choice' : t === 'MULTI_CHOICE' ? 'Multiple Choice' : 'Integer'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Question content */}
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Question content
        </p>

        {/* Question text */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Question text</label>
          <textarea
            rows={3}
            placeholder="Enter the question…"
            className={[
              'rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
              errors.questionText ? 'border-red-500' : 'border-slate-300',
            ].join(' ')}
            {...register('questionText')}
          />
          {errors.questionText?.message && (
            <p className="text-xs text-red-600" role="alert">{errors.questionText.message}</p>
          )}
        </div>

        {/* Question image */}
        <Controller
          control={control}
          name="questionImageUrl"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ImageUpload
              label="Question image"
              value={value}
              onChange={(url) => onChange(url ?? undefined)}
              onUploadStateChange={(up) =>
                setActiveUploads((c) => Math.max(0, c + (up ? 1 : -1)))
              }
              error={error?.message}
            />
          )}
        />

        {/* LaTeX content */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            LaTeX content{' '}
            <span className="text-xs font-normal text-slate-400">(optional — rendered with KaTeX)</span>
          </label>
          <textarea
            rows={3}
            placeholder="\frac{d}{dx}\left(x^n\right) = nx^{n-1}"
            className={[
              'rounded-md border px-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
              errors.latexContent ? 'border-red-500' : 'border-slate-300',
            ].join(' ')}
            {...register('latexContent')}
          />
          {errors.latexContent?.message && (
            <p className="text-xs text-red-600" role="alert">{errors.latexContent.message}</p>
          )}
        </div>

        {errors.root?.message &&
          !errors.questionText &&
          !errors.questionImageUrl && (
            <p className="text-xs text-red-600" role="alert">
              {errors.root.message}
            </p>
          )}
      </div>

      {/* INTEGER answer */}
      {questionType === 'INTEGER' && (
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Correct integer answer</label>
            <input
              type="number"
              step="1"
              placeholder="0"
              className={[
                'rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
                errors.integerAnswer ? 'border-red-500' : 'border-slate-300',
              ].join(' ')}
              {...register('integerAnswer', { valueAsNumber: true })}
            />
            {errors.integerAnswer?.message && (
              <p className="text-xs text-red-600" role="alert">{errors.integerAnswer.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Choice options */}
      {isChoiceType && (
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Options
            {questionType === 'SINGLE_CHOICE'
              ? ' — select one correct answer'
              : ' — select all correct answers'}
          </p>

          {(errors.options as { message?: string } | undefined)?.message && (
            <p className="text-xs text-red-600" role="alert">
              {(errors.options as { message?: string }).message}
            </p>
          )}

          {fields.map((field, index) => {
            const isCorrect = optionValues[index]?.isCorrect ?? false;
            const optErrors = errors.options?.[index];
            return (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3"
              >
                {/* Correct indicator */}
                <div className="flex flex-col items-center gap-1 pt-6">
                  {questionType === 'SINGLE_CHOICE' ? (
                    <input
                      type="radio"
                      name="question-correct"
                      checked={isCorrect}
                      onChange={() => handleSingleCorrect(index)}
                      className="h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-700"
                      aria-label={`Mark option ${index + 1} as correct`}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={isCorrect}
                      onChange={(e) => handleMultiCorrect(index, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                      aria-label={`Mark option ${index + 1} as correct`}
                    />
                  )}
                  <span className="text-xs text-slate-400">{isCorrect ? '✓' : ''}</span>
                </div>

                {/* Option content */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Option {index + 1} text
                    </label>
                    <input
                      placeholder="Option text…"
                      className={[
                        'rounded-md border px-3 py-2 text-sm text-slate-900 placeholder-slate-400',
                        'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
                        optErrors?.optionText ? 'border-red-500' : 'border-slate-300',
                      ].join(' ')}
                      {...register(`options.${index}.optionText`)}
                    />
                    {optErrors?.optionText?.message && (
                      <p className="text-xs text-red-600" role="alert">
                        {optErrors.optionText.message}
                      </p>
                    )}
                  </div>
                  <Controller
                    control={control}
                    name={`options.${index}.optionImageUrl` as FieldPath<CreateTestQuestionInput>}
                    render={({ field: { value, onChange }, fieldState: { error } }) => (
                      <ImageUpload
                        label={`Option ${index + 1} image`}
                        value={value as string | null | undefined}
                        onChange={(url) => onChange(url ?? undefined)}
                        onUploadStateChange={(up) =>
                          setActiveUploads((c) => Math.max(0, c + (up ? 1 : -1)))
                        }
                        error={error?.message}
                      />
                    )}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700">
                      Option {index + 1} LaTeX{' '}
                      <span className="text-xs font-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="\int x^2 dx"
                      className={[
                        'rounded-md border px-3 py-2 text-sm font-mono text-slate-900 placeholder-slate-400 resize-y',
                        'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
                        errors.options?.[index]?.latexContent ? 'border-red-500' : 'border-slate-300',
                      ].join(' ')}
                      {...register(`options.${index}.latexContent` as FieldPath<CreateTestQuestionInput>)}
                    />
                    {errors.options?.[index]?.latexContent?.message && (
                      <p className="text-xs text-red-600" role="alert">
                        {errors.options[index].latexContent.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => { remove(index); void trigger(); }}
                    className="mt-6 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 self-start rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add option
          </button>
        </div>
      )}

      {/* Publish to Question Bank toggle */}
      <label className="flex cursor-pointer items-start gap-3">
        <div className="mt-0.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
            {...register('publishToQuestionBank')}
            onChange={(e) => {
              setValue('publishToQuestionBank', e.target.checked);
              if (!e.target.checked) {
                setValue('topicId', undefined);
                setChapterId('');
              }
            }}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Also publish to Question Bank</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Creates a permanent copy in the bank so it can be reused in future tests.
          </p>
        </div>
      </label>

      {/* Topic picker — only when publishing */}
      {publishToBank && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Question Bank Placement
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Chapter</label>
            <select
              value={chapterId}
              onChange={(e) => {
                setChapterId(e.target.value);
                setValue('topicId', undefined);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent"
            >
              <option value="">Select a chapter…</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Topic</label>
            <select
              disabled={!chapterId}
              className={[
                'rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900',
                'focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent',
                !chapterId ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
              {...register('topicId')}
            >
              <option value="">Select a topic…</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.topicId?.message && (
              <p className="text-xs text-red-600" role="alert">{errors.topicId.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Root error */}
      {errors.root?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {errors.root.message}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-1">
        {activeUploads > 0 && (
          <p className="mr-auto text-xs text-slate-500 self-center">Upload in progress…</p>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={createTestOnly}
          disabled={!isValid || activeUploads > 0}
          className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          Create For This Test Only
        </button>
        <button
          type="button"
          onClick={createAndPublish}
          disabled={!isValid || activeUploads > 0}
          className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition-colors disabled:opacity-50"
        >
          Create &amp; Publish To Question Bank
        </button>
      </div>
    </form>
  );
}
