import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTopicSchema, type UpdateTopicInput } from '@scientia/validators';
import type { Topic } from '@scientia/types';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useUpdateTopic } from '../hooks/use-topics';
import { ApiError } from '../../../lib/api';

interface EditTopicDialogProps {
  chapterId: string;
  topic: Topic | null;
  onOpenChange: (open: boolean) => void;
}

function EditTopicDialog({
  chapterId,
  topic,
  onOpenChange,
}: EditTopicDialogProps) {
  const { mutateAsync, isPending } = useUpdateTopic(chapterId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateTopicInput>({
    resolver: zodResolver(updateTopicSchema),
    defaultValues: { name: topic?.name ?? '' },
  });

  useEffect(() => {
    if (topic) reset({ name: topic.name });
  }, [topic, reset]);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: UpdateTopicInput) {
    if (!topic) return;
    try {
      await mutateAsync({ id: topic.id, data });
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
      open={topic !== null}
      onOpenChange={handleOpenChange}
      title="Edit Topic"
      description="Rename this topic."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Topic name"
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

export { EditTopicDialog };
