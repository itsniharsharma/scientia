import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { redis } from './redis';

/**
 * express-rate-limit store backed by Upstash Redis.
 * Falls back to fail-open (totalHits: 1) when Redis is unavailable —
 * a temporarily unguarded endpoint is better than a broken login page.
 */
export class UpstashRateLimitStore implements Store {
  private windowMs = 0;

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    if (redis === null) {
      return { totalHits: 1, resetTime: undefined };
    }

    try {
      const redisKey = `rl:${key}`;
      const ttlSeconds = Math.ceil(this.windowMs / 1000);

      const totalHits = await redis.incr(redisKey);

      if (totalHits === 1) {
        // First hit in this window — set the expiry once
        await redis.expire(redisKey, ttlSeconds);
      }

      const ttlRemaining = await redis.ttl(redisKey);
      const resetTime =
        ttlRemaining > 0 ? new Date(Date.now() + ttlRemaining * 1000) : undefined;

      return { totalHits, resetTime };
    } catch {
      // Redis down — fail open rather than blocking users
      return { totalHits: 1, resetTime: undefined };
    }
  }

  async decrement(key: string): Promise<void> {
    if (redis === null) return;
    try {
      await redis.decr(`rl:${key}`);
    } catch {
      // non-fatal
    }
  }

  async resetKey(key: string): Promise<void> {
    if (redis === null) return;
    try {
      await redis.del(`rl:${key}`);
    } catch {
      // non-fatal
    }
  }
}
