import { useState } from 'react';
import type { Chapter } from '@scientia/types';
import { useChapters } from './hooks/use-chapters';
import { ChapterList } from './components/ChapterList';
import { CreateChapterDialog } from './components/CreateChapterDialog';
import { EditChapterDialog } from './components/EditChapterDialog';
import { DeleteChapterDialog } from './components/DeleteChapterDialog';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { useNavigationStore } from '../../store/navigation.store';

interface ChaptersPageProps {
  subjectId: string;
  subjectName: string;
}

function ChaptersPage({ subjectId, subjectName }: ChaptersPageProps) {
  const { data: chapters, isLoading, isError, error } = useChapters(subjectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Chapter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);
  const { selectSubject, selectChapter } = useNavigationStore();

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
            <span className="text-gray-900 font-medium">{subjectName}</span>
          </nav>
          <h1 className="text-lg font-semibold text-gray-900">Chapters</h1>
          {!isLoading && !isError && (
            <p className="text-sm text-gray-500">
              {chapters?.length ?? 0}{' '}
              {chapters?.length === 1 ? 'chapter' : 'chapters'}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Chapter</Button>
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
              Failed to load chapters
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && chapters?.length === 0 && (
          <EmptyState
            title="No chapters yet"
            description="Create your first chapter to organise topics under this subject."
          />
        )}

        {!isLoading && !isError && chapters && chapters.length > 0 && (
          <ChapterList
            chapters={chapters}
            onSelect={(c) => selectChapter(c.id, c.name)}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <CreateChapterDialog
        subjectId={subjectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditChapterDialog
        subjectId={subjectId}
        chapter={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />
      <DeleteChapterDialog
        subjectId={subjectId}
        chapter={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export { ChaptersPage };
