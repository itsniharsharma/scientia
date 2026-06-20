import { useEffect } from 'react';
import { useForm, useFieldArray, useWatch, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateQuestionSchema } from '@scientia/validators';
import type { UpdateQuestionInput } from '@scientia/validators';
import type { Question, QuestionType } from '@scientia/types';
import { Modal } from '../../shared/components/Modal';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { useUpdateQuestion } from './hooks/use-questions';
import { ApiError } from '../../lib/api';

// Preprocess form strings to the nullable/optional values updateQuestionSchema expects.
// Empty string → null (signals "clear this field" to the backend).
const formSchema = z.preprocess((input) => {
  if (typeof input !== 'object' || input === null) return input;
  const d = input as Record<string, unknown>;
  const trimOrNull = (v: unknown) =>
    typeof v === 'string' ? (v.trim() || null) : v;
  const trimOrUndef = (v: unknown) =>
    typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
  return {
    ...d,
    questionText: trimOrNull(d.questionText),
    questionImageUrl: trimOrNull(d.questionImageUrl),
    options: Array.isArray(d.options)
      ? d.options.map((o: unknown) => {
          if (typeof o !== 'object' || o === null) return o;
          const opt = o as Record<string, unknown>;
          return {
            ...opt,
            optionText: trimOrUndef(opt.optionText),
            optionImageUrl: trimOrUndef(opt.optionImageUrl),
          };
        })
      : d.options,
  };
}, updateQuestionSchema);

const TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Single Choice',
  MULTI_CHOICE: 'Multiple Choice',
  INTEGER: 'Integer',
};

const TYPE_BADGE_CLASSES: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'bg-blue-50 text-blue-700 ring-blue-200',
  MULTI_CHOICE: 'bg-purple-50 text-purple-700 ring-purple-200',
  INTEGER: 'bg-orange-50 text-orange-700 ring-orange-200',
};

interface EditQuestionDialogProps {
  topicId: string;
  question: Question | null;
  onOpenChange: (open: boolean) => void;
}

function EditQuestionDialog({
  topicId,
  question,
  onOpenChange,
}: EditQuestionDialogProps) {
  const { mutateAsync, isPending } = useUpdateQuestion(topicId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isValid },
  } = useForm<UpdateQuestionInput>({
    resolver: zodResolver(formSchema),
    shouldUnregister: true,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const optionValues = useWatch({ control, name: 'options' }) ?? [];

  useEffect(() => {
    if (!question) return;
    reset({
      questionText: question.questionText ?? '',
      questionImageUrl: question.questionImageUrl ?? '',
      integerAnswer: question.integerAnswer ?? undefined,
      options: question.options.map((o) => ({
        position: o.position,
        optionText: o.optionText ?? '',
        optionImageUrl: o.optionImageUrl ?? '',
        isCorrect: o.isCorrect,
      })),
    });
  }, [question, reset]);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSingleCorrect(correctIndex: number) {
    fields.forEach((_, i) => {
      setValue(`options.${i}.isCorrect`, i === correctIndex, {
        shouldValidate: true,
      });
    });
  }

  function handleMultiCorrect(index: number, checked: boolean) {
    setValue(`options.${index}.isCorrect`, checked, { shouldValidate: true });
  }

  function addOption() {
    append({
      position: fields.length,
      optionText: '',
      optionImageUrl: '',
      isCorrect: false,
    });
  }

  async function onSubmit(data: UpdateQuestionInput) {
    if (!question) return;
    try {
      await mutateAsync({ id: question.id, data });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.details?.length) {
        err.details.forEach((d) =>
          setError(d.field as FieldPath<UpdateQuestionInput>, {
            message: d.message,
          }),
        );
      } else if (err instanceof ApiError) {
        setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Something went wrong. Please try again.' });
      }
    }
  }

  if (!question) return null;

  const isChoiceType =
    question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE';

  return (
    <Modal
      open={question !== null}
      onOpenChange={handleOpenChange}
      title="Edit Question"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Type badge — read only */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Type:</span>
          <span
            className={[
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
              TYPE_BADGE_CLASSES[question.type],
            ].join(' ')}
          >
            {TYPE_LABELS[question.type]}
          </span>
          <span className="text-xs text-gray-400">(immutable)</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Question content
          </p>
          <Input
            label="Question text"
            placeholder="Enter the question…"
            error={errors.questionText?.message}
            {...register('questionText')}
          />
          <Input
            label="Image URL"
            placeholder="https://…"
            error={errors.questionImageUrl?.message}
            {...register('questionImageUrl')}
          />
        </div>

        {/* INTEGER answer */}
        {question.type === 'INTEGER' && (
          <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Answer
            </p>
            <Input
              label="Correct integer answer"
              type="number"
              step="1"
              placeholder="0"
              error={errors.integerAnswer?.message}
              {...register('integerAnswer', { valueAsNumber: true })}
            />
          </div>
        )}

        {/* Choice options */}
        {isChoiceType && (
          <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Options
              {question.type === 'SINGLE_CHOICE'
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
                  className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3"
                >
                  {/* Correct indicator */}
                  <div className="flex flex-col items-center gap-1 pt-6">
                    {question.type === 'SINGLE_CHOICE' ? (
                      <input
                        type="radio"
                        name="edit-question-correct"
                        checked={isCorrect}
                        onChange={() => handleSingleCorrect(index)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Mark option ${index + 1} as correct`}
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={isCorrect}
                        onChange={(e) =>
                          handleMultiCorrect(index, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Mark option ${index + 1} as correct`}
                      />
                    )}
                    <span className="text-xs text-gray-400">
                      {isCorrect ? '✓' : ''}
                    </span>
                  </div>

                  {/* Option content */}
                  <div className="flex-1 space-y-2">
                    <Input
                      label={`Option ${index + 1} text`}
                      placeholder="Option text…"
                      error={optErrors?.optionText?.message}
                      {...register(`options.${index}.optionText`)}
                    />
                    <Input
                      label={`Option ${index + 1} image URL`}
                      placeholder="https://…"
                      error={optErrors?.optionImageUrl?.message}
                      {...register(`options.${index}.optionImageUrl`)}
                    />
                  </div>

                  {/* Remove */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-6 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1.5 self-start rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
            >
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add option
            </button>
          </div>
        )}

        {errors.root?.message && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={!isValid}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { EditQuestionDialog };
