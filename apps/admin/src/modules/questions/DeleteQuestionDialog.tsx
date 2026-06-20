import type { Question } from '@scientia/types';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { useDeleteQuestion } from './hooks/use-questions';

interface DeleteQuestionDialogProps {
  topicId: string;
  question: Question | null;
  onOpenChange: (open: boolean) => void;
}

function DeleteQuestionDialog({
  topicId,
  question,
  onOpenChange,
}: DeleteQuestionDialogProps) {
  const { mutateAsync, isPending, error, reset } = useDeleteQuestion(topicId);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleDelete() {
    if (!question) return;
    try {
      await mutateAsync(question.id);
      onOpenChange(false);
    } catch {
      // error displayed below
    }
  }

  return (
    <Modal
      open={question !== null}
      onOpenChange={handleOpenChange}
      title="Delete Question"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this question? This action cannot be
          undone and will remove all associated options.
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

export { DeleteQuestionDialog };
