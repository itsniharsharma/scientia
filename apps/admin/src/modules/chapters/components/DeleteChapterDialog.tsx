import type { Chapter } from '@scientia/types';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { useDeleteChapter } from '../hooks/use-chapters';

interface DeleteChapterDialogProps {
  subjectId: string;
  chapter: Chapter | null;
  onOpenChange: (open: boolean) => void;
}

function DeleteChapterDialog({
  subjectId,
  chapter,
  onOpenChange,
}: DeleteChapterDialogProps) {
  const { mutateAsync, isPending, error, reset } = useDeleteChapter(subjectId);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleDelete() {
    if (!chapter) return;
    try {
      await mutateAsync(chapter.id);
      onOpenChange(false);
    } catch {
      // error displayed below
    }
  }

  return (
    <Modal
      open={chapter !== null}
      onOpenChange={handleOpenChange}
      title="Delete Chapter"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-900">{chapter?.name}</span>?
          This action cannot be undone.
        </p>
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Something went wrong.'}
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
          <Button
            type="button"
            variant="danger"
            loading={isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { DeleteChapterDialog };
