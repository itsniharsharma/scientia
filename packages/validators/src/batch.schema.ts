import { z } from 'zod';

export const createBatchSchema = z.object({
  name: z
    .string({ required_error: 'Batch name is required' })
    .trim()
    .min(1, 'Batch name is required')
    .max(100, 'Batch name must be 100 characters or less'),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const updateBatchSchema = z.object({
  name: z
    .string({ required_error: 'Batch name is required' })
    .trim()
    .min(1, 'Batch name is required')
    .max(100, 'Batch name must be 100 characters or less'),
});

export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

export const addStudentToBatchSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(1, 'Username is required'),
});

export type AddStudentToBatchInput = z.infer<typeof addStudentToBatchSchema>;
