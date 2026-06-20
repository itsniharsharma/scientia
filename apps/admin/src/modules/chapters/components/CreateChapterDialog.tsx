import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChapterSchema, type CreateChapterInput } from '@scientia/validators';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useCreateChapter } from '../hooks/use-chapters';
import { ApiError } from '../../../lib/api';

interface CreateChapterDialogProps {
  subjectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateChapterDialog({
  subjectId,
  open,
  onOpenChange,
}: CreateChapterDialogProps) {
  const { mutateAsync, isPending } = useCreateChapter(subjectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateChapterInput>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { name: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: CreateChapterInput) {
    try {
      await mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('name', { message: err.message });
      } else {
        setError('name', { message: 'Something went wrong. Please try again.' });
      }
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="New Chapter"
      description="Add a chapter to this subject."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Chapter name"
          placeholder="e.g. Electrostatics"
          autoFocus
          error={errors.name?.message}
          {...register('name')}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { CreateChapterDialog };
