import { redis } from '../lib/redis';
import { logger } from './logger';

// ─── Cache Keys ───────────────────────────────────────────────────────────────

export const CACHE_KEYS = {
  analytics:       (testId: string)    => `analytics:test:${testId}`,
  teacherBatches:  (teacherId: string) => `teacher:${teacherId}:batches`,
  teacherTests:    (teacherId: string) => `teacher:${teacherId}:tests`,
  studentDashboard:(studentId: string) => `student:${studentId}:dashboard`,
} as const;

// ─── TTLs (seconds) ───────────────────────────────────────────────────────────

export const TTL = {
  ANALYTICS:        300,   // 5 min  — staleness tolerable while exam is active
  TEACHER_BATCHES:  900,   // 15 min — invalidated on every batch mutation
  TEACHER_TESTS:    900,   // 15 min — invalidated on every test mutation
  STUDENT_DASHBOARD:600,   // 10 min — invalidated on submit + assignment changes
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Cache-aside read.
 * On Redis miss or Redis error: runs fallback, writes result to cache, returns data.
 * On Redis hit: returns cached value without touching the DB.
 * Redis errors never propagate to the caller.
 */
export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  fallback: () => Promise<T>,
): Promise<T> {
  if (redis === null) {
    return fallback();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (err) {
    logger.warn('Redis read error — falling back to DB', {
      key,
      err: (err as Error).message,
    });
  }

  const data = await fallback();

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (err) {
    logger.warn('Redis write error — result not cached', {
      key,
      err: (err as Error).message,
    });
  }

  return data;
}

/**
 * Delete one or more cache keys.
 * Errors are swallowed — a failed invalidation results in TTL-bounded staleness,
 * which is acceptable for all cached surfaces in Scientia.
 */
export async function invalidate(...keys: string[]): Promise<void> {
  if (redis === null || keys.length === 0) return;

  try {
    const [first, ...rest] = keys as [string, ...string[]];
    await redis.del(first, ...rest);
  } catch (err) {
    logger.warn('Redis invalidation error', {
      keys,
      err: (err as Error).message,
    });
  }
}
