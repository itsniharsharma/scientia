import { Redis } from '@upstash/redis';
import { logger } from '../shared/logger';

const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  logger.warn('Redis disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — all cache operations will be no-ops');
}

export const redis =
  UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN })
    : null;
