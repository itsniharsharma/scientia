import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSubjectSchema, type CreateSubjectInput } from '@scientia/validators';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useCreateSubject } from '../hooks/use-subjects';
import { ApiError } from '../../../lib/api';

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateSubjectDialog({ open, onOpenChange }: CreateSubjectDialogProps) {
  const { mutateAsync, isPending } = useCreateSubject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '' },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: CreateSubjectInput) {
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
      title="New Subject"
      description="Add a subject to your question bank."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Subject name"
          placeholder="e.g. Physics"
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

export { CreateSubjectDialog };
