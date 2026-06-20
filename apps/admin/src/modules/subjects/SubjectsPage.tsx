import { useState } from 'react';
import type { Subject } from '@scientia/types';
import { useSubjects } from './hooks/use-subjects';
import { SubjectList } from './components/SubjectList';
import { CreateSubjectDialog } from './components/CreateSubjectDialog';
import { EditSubjectDialog } from './components/EditSubjectDialog';
import { DeleteSubjectDialog } from './components/DeleteSubjectDialog';
import { Button } from '../../shared/components/Button';
import { Spinner } from '../../shared/components/Spinner';
import { EmptyState } from '../../shared/components/EmptyState';
import { useNavigationStore } from '../../store/navigation.store';

function SubjectsPage() {
  const { data: subjects, isLoading, isError, error } = useSubjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const { selectSubject } = useNavigationStore();

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Subjects</h1>
          {!isLoading && !isError && (
            <p className="text-sm text-gray-500">
              {subjects?.length ?? 0}{' '}
              {subjects?.length === 1 ? 'subject' : 'subjects'}
            </p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>New Subject</Button>
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
              Failed to load subjects
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && subjects?.length === 0 && (
          <EmptyState
            title="No subjects yet"
            description="Create your first subject to start building your question bank."
          />
        )}

        {!isLoading && !isError && subjects && subjects.length > 0 && (
          <SubjectList
            subjects={subjects}
            onSelect={(s) => selectSubject(s.id, s.name)}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <CreateSubjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditSubjectDialog
        subject={editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
      />
      <DeleteSubjectDialog
        subject={deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      />
    </div>
  );
}

export { SubjectsPage };
