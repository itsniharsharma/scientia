import { useState } from 'react';
import type { Topic } from '@scientia/types';
import { useTopics } from './hooks/use-topics';
import { TopicList } from './components/TopicList';
import { CreateTopicDialog } from './components/CreateTopicDialog';
import { EditTopicDialog } from './components/EditTopicDialog';
import { DeleteTopicDialog } from './components/DeleteTopicDialog';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { useNavigationStore } from '../../store/navigation.store';

interface TopicsPageProps {
  chapterId: string;
  chapterName: string;
  subjectName: string;
}

function TopicsPage({ chapterId, chapterName, subjectName }: TopicsPageProps) {
  const { data: topics, isLoading, isError, error } = useTopics(chapterId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Topic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);
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
            <span className="font-medium text-gray-900">{chapterName}</span>
          </nav>
          <h1 className="text-lg font-semibold text-gray-900">Topics</h1>
          {!isLoading && !isError && (
            <p className="text-sm text-gray-500">
              {topics?.length ?? 0}{' '}
              {topics?.length === 1 ? 'topic' : 'topics'}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Topic</Button>
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
              Failed to load topics
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && topics?.length === 0 && (
          <EmptyState
            title="No topics yet"
            description="Create your first topic to start adding questions to this chapter."
          />
        )}

        {!isLoading && !isError && topics && topics.length > 0 && (
          <TopicList
            topics={topics}
            onSelect={(t) => selectTopic(t.id, t.name)}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <CreateTopicDialog
        chapterId={chapterId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditTopicDialog
        chapterId={chapterId}
        topic={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />
      <DeleteTopicDialog
        chapterId={chapterId}
        topic={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export { TopicsPage };
