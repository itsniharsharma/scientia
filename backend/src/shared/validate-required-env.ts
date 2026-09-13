// Startup guard: refuses to boot if any required environment variable is
// absent. Extracted from index.ts as a pure function (reads an explicit env
// object, never process.env directly) so it's actually testable — the
// previous inline version ran at module top-level and called
// process.exit(1), which made it untestable without killing the test
// runner.

export const REQUIRED_ENV = [
  'JWT_SECRET',
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_ALLOWED_USER_IDS',
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV)[number];

export interface MissingEnvVar {
  key: RequiredEnvKey;
  /** Distinguishes "the key was never set" from "the key exists but its
   *  value is an empty string" — both correctly fail this check (an empty
   *  secret is not usable), but they point to different real-world causes:
   *  the former usually means the variable isn't configured for this
   *  service/environment at all; the latter usually means it IS configured
   *  in the platform's dashboard but with a blank value (e.g. a paste
   *  error) — a distinction the previous single "missing" list couldn't
   *  show, and one that matters when a variable is genuinely configured
   *  somewhere but still not reaching the process correctly. */
  reason: 'unset' | 'empty';
}

/** Never logs or reads an actual secret value — only whether each required
 *  key is present and non-empty. Pass a specific `env` (defaults to the
 *  real process.env) so this can be tested without touching the real
 *  process environment. */
export function checkRequiredEnv(env: NodeJS.ProcessEnv = process.env): MissingEnvVar[] {
  const missing: MissingEnvVar[] = [];
  for (const key of REQUIRED_ENV) {
    const value = env[key];
    if (value === undefined) missing.push({ key, reason: 'unset' });
    else if (value === '') missing.push({ key, reason: 'empty' });
  }
  return missing;
}
