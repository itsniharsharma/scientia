import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTopicSchema, type CreateTopicInput } from '@scientia/validators';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useCreateTopic } from '../hooks/use-topics';
import { ApiError } from '../../../lib/api';

interface CreateTopicDialogProps {
  chapterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateTopicDialog({
  chapterId,
  open,
  onOpenChange,
}: CreateTopicDialogProps) {
  const { mutateAsync, isPending } = useCreateTopic(chapterId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateTopicInput>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { name: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: CreateTopicInput) {
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
      title="New Topic"
      description="Add a topic to this chapter."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Topic name"
          placeholder="e.g. Coulomb's Law"
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

export { CreateTopicDialog };
