import { z } from 'zod';

const envSchema = z.object({
  // ─── Application ──────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_PORT: z.coerce.number().int().positive().default(3003),
  BOT_PORT: z.coerce.number().int().positive().default(3002),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3001'),
  BOT_URL: z.string().url().default('http://localhost:3002'),

  // ─── Authentication ────────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ─── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DATABASE_POOL_MIN: z.coerce.number().int().nonnegative().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  // ─── Redis ────────────────────────────────────────────────────────────────
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('false'),

  // ─── Telegram ─────────────────────────────────────────────────────────────
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1),
  TELEGRAM_GROUP_ID: z.string().min(1),
  TELEGRAM_WEBHOOK_URL: z.string().url(),

  // ─── Gemini ───────────────────────────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  GEMINI_RATE_LIMIT_RPM: z.coerce.number().int().positive().default(60),

  // ─── Cloudflare R2 ────────────────────────────────────────────────────────
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),

  // ─── Cloudinary ───────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1),

  // ─── BullMQ / Queue ───────────────────────────────────────────────────────
  QUEUE_PREFIX: z.string().default('scientia'),
  WORKER_CONCURRENCY_PDF_INGEST: z.coerce.number().int().positive().default(2),
  WORKER_CONCURRENCY_PAGE_EXTRACT: z.coerce.number().int().positive().default(5),
  WORKER_CONCURRENCY_PDF_STITCH: z.coerce.number().int().positive().default(3),
  PAGE_EXTRACT_RATE_LIMIT_RPM: z.coerce.number().int().positive().default(60),

  // ─── Monitoring ───────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function validateEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([field, msgs]) => `  ${field}: ${msgs?.join(', ')}`)
      .join('\n');

    console.error('❌ Environment validation failed:\n' + messages);
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export function getEnv(): Env {
  if (!_env) return validateEnv();
  return _env;
}

export function resetEnv(): void {
  _env = undefined;
}
