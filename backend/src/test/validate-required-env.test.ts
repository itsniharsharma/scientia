import { describe, it, expect } from 'vitest';
import { checkRequiredEnv, REQUIRED_ENV } from '../shared/validate-required-env';

// Regression tests for the startup required-env guard (index.ts). These
// exist specifically to prove the check correctly reads whatever env object
// it's given — a real Render production incident reported these variables
// as "missing" despite being "configured" in the dashboard. Tracing every
// place these names are read (cloudinary.service.ts, telegram.guards.ts,
// telegram.bot.ts, telegram.adapter.ts, telegram.webhook.ts,
// telegram.document.ts, health.routes.ts) confirmed no code path renames,
// transforms, or reads a different object — every one reads the identical
// literal key straight off process.env. These tests pin that the shared
// check itself behaves correctly, including the previously-invisible
// "set but empty" case, so this specific class of ambiguity can't recur
// unnoticed. They cannot verify Render's own dashboard/deploy configuration
// — only that this codebase's logic is correct given whatever env it's
// handed.

function fullValidEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of REQUIRED_ENV) env[key] = `fake-${key.toLowerCase()}-value`;
  return env;
}

describe('checkRequiredEnv', () => {
  it('reports nothing missing when every required variable is set to a real value', () => {
    expect(checkRequiredEnv(fullValidEnv())).toEqual([]);
  });

  it('reports a variable as "unset" when the key is absent entirely', () => {
    const env = fullValidEnv();
    delete env.TELEGRAM_BOT_TOKEN;
    expect(checkRequiredEnv(env)).toEqual([{ key: 'TELEGRAM_BOT_TOKEN', reason: 'unset' }]);
  });

  it('reports a variable as "empty" (not "unset") when it exists but is a blank string', () => {
    // This is the case a human checking a dashboard UI would call
    // "configured" (the key is there) while the app correctly still
    // refuses to start, because an empty secret is not usable.
    const env = fullValidEnv();
    env.CLOUDINARY_API_KEY = '';
    expect(checkRequiredEnv(env)).toEqual([{ key: 'CLOUDINARY_API_KEY', reason: 'empty' }]);
  });

  it('reports every missing variable, each with its own correct reason, when several are affected', () => {
    const env = fullValidEnv();
    delete env.CLOUDINARY_CLOUD_NAME;
    delete env.CLOUDINARY_API_KEY;
    env.TELEGRAM_BOT_TOKEN = '';
    env.TELEGRAM_WEBHOOK_SECRET = '';
    delete env.TELEGRAM_ALLOWED_USER_IDS;

    const result = checkRequiredEnv(env);
    expect(result).toHaveLength(5);
    expect(result).toEqual(
      expect.arrayContaining([
        { key: 'CLOUDINARY_CLOUD_NAME', reason: 'unset' },
        { key: 'CLOUDINARY_API_KEY', reason: 'unset' },
        { key: 'TELEGRAM_BOT_TOKEN', reason: 'empty' },
        { key: 'TELEGRAM_WEBHOOK_SECRET', reason: 'empty' },
        { key: 'TELEGRAM_ALLOWED_USER_IDS', reason: 'unset' },
      ]),
    );
  });

  it('defaults to reading the real process.env when called with no argument', () => {
    const original = process.env.JWT_SECRET;
    try {
      process.env.JWT_SECRET = 'a-real-looking-value';
      const result = checkRequiredEnv();
      expect(result.find((m) => m.key === 'JWT_SECRET')).toBeUndefined();
    } finally {
      if (original === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = original;
    }
  });

  it('never includes the actual value of a variable anywhere in its output', () => {
    const env = fullValidEnv();
    env.TELEGRAM_BOT_TOKEN = 'a-secret-token-value-that-must-never-leak';
    delete env.CLOUDINARY_API_KEY; // the one reported as missing
    const result = checkRequiredEnv(env);

    // Each entry is strictly {key, reason} — no value field exists to leak.
    for (const entry of result) {
      expect(Object.keys(entry).sort()).toEqual(['key', 'reason']);
    }
    expect(JSON.stringify(result)).not.toContain('a-secret-token-value-that-must-never-leak');
  });
});
