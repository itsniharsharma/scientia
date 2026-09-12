import { z } from 'zod';

const firstNameSchema = z
  .string({ required_error: 'First name is required' })
  .trim()
  .min(1, 'First name is required')
  .max(50, 'First name must be 50 characters or less');

const lastNameSchema = z
  .string({ required_error: 'Last name is required' })
  .trim()
  .min(1, 'Last name is required')
  .max(50, 'Last name must be 50 characters or less');

const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .regex(
    /^[6-9]\d{9}$/,
    'Phone number must be a valid 10-digit Indian mobile number',
  );

const usernameSchema = z
  .string({ required_error: 'Username is required' })
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or less')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores',
  );

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters');

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address');

export const registerStudentSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;

// Teacher registration selects an EXISTING organisation by id — the backend
// verifies the organisation actually exists before creating the teacher.
// There is no way to create a new organisation through this schema.
export const registerTeacherSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  organisationId: z.string({ required_error: 'Organisation is required' }).trim().min(1, 'Organisation is required'),
});

export type RegisterTeacherInput = z.infer<typeof registerTeacherSchema>;

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
