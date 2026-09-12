import { z } from 'zod';

export const registerOrganisationSchema = z.object({
  name: z
    .string({ required_error: 'Organisation name is required' })
    .trim()
    .min(2, 'Organisation name must be at least 2 characters')
    .max(100, 'Organisation name must be 100 characters or less'),
});

export type RegisterOrganisationInput = z.infer<typeof registerOrganisationSchema>;

export const assignStudentToOrganisationSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(1, 'Username is required'),
});

export type AssignStudentToOrganisationInput = z.infer<typeof assignStudentToOrganisationSchema>;
