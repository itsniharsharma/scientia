import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
});

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_URL: z.string().url().default('http://localhost:3001'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function validateClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
  });

  if (!result.success) {
    console.error('❌ Invalid client environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

function validateServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv() must only be called on the server side');
  }

  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env['NODE_ENV'],
    API_URL: process.env['API_URL'],
  });

  if (!result.success) {
    console.error('❌ Invalid server environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

export const clientEnv = validateClientEnv();
export const getServerEnv = (): ServerEnv => validateServerEnv();
