import { redis } from '../../lib/redis';

const WINDOW_SECONDS = 60;
const MAX_UPLOADS    = 20;

/**
 * Sliding-window rate limit for Telegram uploads.
 * 20 uploads per 60 seconds per teacher.
 * Fails open when Redis is unavailable.
 */
export async function checkUploadRateLimit(
  teacherId: string,
): Promise<{ allowed: boolean; resetInSeconds: number }> {
  if (!redis) return { allowed: true, resetInSeconds: 0 };

  const key = `rl:tg:upload:${teacherId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_UPLOADS) {
      await redis.decr(key); // undo — this attempt does not consume a slot
      const ttl = Math.max(0, await redis.ttl(key));
      return { allowed: false, resetInSeconds: ttl };
    }

    return { allowed: true, resetInSeconds: 0 };
  } catch {
    return { allowed: true, resetInSeconds: 0 }; // fail open on Redis error
  }
}
