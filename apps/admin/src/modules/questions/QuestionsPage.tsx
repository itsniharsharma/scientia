import { useState } from 'react';
import type { Question } from '@scientia/types';
import { useQuestions } from './hooks/use-questions';
import { QuestionList } from './QuestionList';
import { CreateQuestionDialog } from './CreateQuestionDialog';
import { EditQuestionDialog } from './EditQuestionDialog';
import { DeleteQuestionDialog } from './DeleteQuestionDialog';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { useNavigationStore } from '../../store/navigation.store';

interface QuestionsPageProps {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectName: string;
}

function QuestionsPage({
  topicId,
  topicName,
  chapterName,
  subjectName,
}: QuestionsPageProps) {
  const { data: questions, isLoading, isError, error } = useQuestions(topicId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const { selectSubject, selectChapter, selectTopic } = useNavigationStore();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div>
          <nav className="mb-0.5 flex items-center gap-1.5 text-sm text-gray-500">
            <button
              onClick={() => selectSubject(null)}
              className="hover:text-gray-700 hover:underline"
            >
              Subjects
            </button>
            <span>/</span>
            <button
              onClick={() => selectChapter(null)}
              className="hover:text-gray-700 hover:underline"
            >
              {subjectName}
            </button>
            <span>/</span>
            <button
              onClick={() => selectTopic(null)}
              className="hover:text-gray-700 hover:underline"
            >
              {chapterName}
            </button>
            <span>/</span>
            <span className="font-medium text-gray-900">{topicName}</span>
          </nav>
          <h1 className="text-lg font-semibold text-gray-900">Questions</h1>
          {!isLoading && !isError && (
            <p className="text-sm text-gray-500">
              {questions?.length ?? 0}{' '}
              {questions?.length === 1 ? 'question' : 'questions'}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Question</Button>
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-800">
              Failed to load questions
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && questions?.length === 0 && (
          <EmptyState
            title="No questions yet"
            description="Create your first question for this topic."
          />
        )}

        {!isLoading && !isError && questions && questions.length > 0 && (
          <QuestionList
            questions={questions}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <CreateQuestionDialog
        topicId={topicId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditQuestionDialog
        topicId={topicId}
        question={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />
      <DeleteQuestionDialog
        topicId={topicId}
        question={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export { QuestionsPage };
