import { z } from 'zod';

export const registerStudentSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters'),

  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(
      /^[6-9]\d{9}$/,
      'Phone number must be a valid 10-digit Indian mobile number',
    ),

  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    ),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;

export const loginStudentSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(1, 'Username is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginStudentInput = z.infer<typeof loginStudentSchema>;

export const loginTeacherSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(1, 'Username is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginTeacherInput = z.infer<typeof loginTeacherSchema>;
