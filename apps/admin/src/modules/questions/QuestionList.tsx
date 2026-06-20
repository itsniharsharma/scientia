import type { Question, QuestionType } from '@scientia/types';

interface QuestionListProps {
  questions: Question[];
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
}

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

function questionPreview(q: Question): string {
  if (q.questionText) {
    return q.questionText.length > 80
      ? q.questionText.slice(0, 80) + '…'
      : q.questionText;
  }
  return 'Image only';
}

function answerPreview(q: Question): string {
  if (q.type === 'INTEGER') {
    return q.integerAnswer !== null ? `Answer: ${q.integerAnswer}` : '—';
  }
  const correctCount = q.options.filter((o) => o.isCorrect).length;
  return `${correctCount} correct / ${q.options.length} options`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function QuestionList({ questions, onEdit, onDelete }: QuestionListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th
              scope="col"
              className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Type
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Question
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Answer
            </th>
            <th
              scope="col"
              className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Created
            </th>
            <th scope="col" className="relative px-5 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {questions.map((q) => (
            <tr key={q.id} className="group transition-colors hover:bg-gray-50">
              <td className="px-5 py-3.5">
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                    TYPE_BADGE_CLASSES[q.type],
                  ].join(' ')}
                >
                  {TYPE_LABELS[q.type]}
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-900">
                {questionPreview(q)}
                {q.questionImageUrl && (
                  <span className="ml-1.5 text-xs text-gray-400">
                    {q.questionText ? '+ image' : ''}
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-500">
                {answerPreview(q)}
              </td>
              <td className="px-5 py-3.5 text-sm text-gray-500">
                {formatDate(q.createdAt)}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(q)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Edit question"
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
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(q)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete question"
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
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { QuestionList };
