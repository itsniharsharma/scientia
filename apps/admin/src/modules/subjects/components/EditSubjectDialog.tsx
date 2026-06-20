import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSubjectSchema, type UpdateSubjectInput } from '@scientia/validators';
import type { Subject } from '@scientia/types';
import { Modal } from '../../../shared/components/Modal';
import { Input } from '../../../shared/components/Input';
import { Button } from '../../../shared/components/Button';
import { useUpdateSubject } from '../hooks/use-subjects';
import { ApiError } from '../../../lib/api';

interface EditSubjectDialogProps {
  subject: Subject | null;
  onOpenChange: (open: boolean) => void;
}

function EditSubjectDialog({ subject, onOpenChange }: EditSubjectDialogProps) {
  const { mutateAsync, isPending } = useUpdateSubject();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateSubjectInput>({
    resolver: zodResolver(updateSubjectSchema),
    defaultValues: { name: subject?.name ?? '' },
  });

  useEffect(() => {
    if (subject) reset({ name: subject.name });
  }, [subject, reset]);

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(data: UpdateSubjectInput) {
    if (!subject) return;
    try {
      await mutateAsync({ id: subject.id, data });
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
      open={subject !== null}
      onOpenChange={handleOpenChange}
      title="Edit Subject"
      description="Rename this subject."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Subject name"
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

export { EditSubjectDialog };
