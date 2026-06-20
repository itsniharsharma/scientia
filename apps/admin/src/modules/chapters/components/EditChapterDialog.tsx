import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateChapterSchema, type UpdateChapterInput } from '@scientia/validators';
import type { Chapter } from '@scientia/types';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useUpdateChapter } from '../hooks/use-chapters';
import { ApiError } from '../../../lib/api';

interface EditChapterDialogProps {
  subjectId: string;
  chapter: Chapter | null;
  onOpenChange: (open: boolean) => void;
}

function EditChapterDialog({
  subjectId,
  chapter,
  onOpenChange,
}: EditChapterDialogProps) {
  const { mutateAsync, isPending } = useUpdateChapter(subjectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateChapterInput>({
    resolver: zodResolver(updateChapterSchema),
    defaultValues: { name: chapter?.name ?? '' },
  });

  useEffect(() => {
    if (chapter) reset({ name: chapter.name });
  }, [chapter, reset]);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: UpdateChapterInput) {
    if (!chapter) return;
    try {
      await mutateAsync({ id: chapter.id, data });
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
      open={chapter !== null}
      onOpenChange={handleOpenChange}
      title="Edit Chapter"
      description="Rename this chapter."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Chapter name"
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
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { EditChapterDialog };
