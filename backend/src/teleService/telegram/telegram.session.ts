import { redis } from '../../lib/redis';
import { logger } from '../../shared/logger';
import type { TelegramSession } from './telegram.types';

const SESSION_TTL_SECONDS = 30 * 60; // 30-minute inactivity window

const sessionKey = (userId: string) => `tg:session:${userId}`;

// In-memory fallback used when Redis is not configured (dev / CI without Upstash)
const devStore = new Map<string, TelegramSession>();

// ── Core session operations ───────────────────────────────────────────────────

export async function getSession(userId: string): Promise<TelegramSession | null> {
  if (!redis) return devStore.get(userId) ?? null;
  try {
    return await redis.get<TelegramSession>(sessionKey(userId));
  } catch (err) {
    logger.error('SESSION_READ_ERROR', { userId, error: String(err) });
    return null;
  }
}

export async function setSession(userId: string, session: TelegramSession): Promise<void> {
  if (!redis) {
    devStore.set(userId, session);
    return;
  }
  try {
    await redis.set(sessionKey(userId), session, { ex: SESSION_TTL_SECONDS });
  } catch (err) {
    logger.error('SESSION_WRITE_ERROR', { userId, error: String(err) });
  }
}

export async function patchSession(
  userId: string,
  patch: Partial<TelegramSession>,
): Promise<TelegramSession> {
  const current = (await getSession(userId)) ?? {};
  const updated: TelegramSession = { ...current, ...patch };
  await setSession(userId, updated);
  return updated;
}

export async function clearSession(userId: string): Promise<void> {
  if (!redis) {
    devStore.delete(userId);
    return;
  }
  try {
    await redis.del(sessionKey(userId));
  } catch (err) {
    logger.error('SESSION_CLEAR_ERROR', { userId, error: String(err) });
  }
}

// ── Duplicate-detection helpers ───────────────────────────────────────────────

const DEDUP_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const dedupKey = (fileUniqueId: string) => `tg:dedup:${fileUniqueId}`;

/** Returns the questionId if this fileUniqueId was uploaded in the last 24 h, else null. */
export async function checkDuplicate(fileUniqueId: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get<string>(dedupKey(fileUniqueId));
  } catch {
    return null; // Redis error — allow upload (fail open)
  }
}

/** Records that fileUniqueId produced questionId; expires after 24 h. */
export async function markUploaded(fileUniqueId: string, questionId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(dedupKey(fileUniqueId), questionId, { ex: DEDUP_TTL_SECONDS });
  } catch {
    // non-fatal — a dedup miss is acceptable
  }
}

// ── Upload-flow helpers ───────────────────────────────────────────────────────

/** Returns a new session with all upload-flow fields removed; context is preserved. */
export function clearUploadFlow(session: TelegramSession): TelegramSession {
  const {
    step: _step,
    fileId: _fileId,
    fileUniqueId: _fileUniqueId,
    questionType: _questionType,
    correctAnswer: _correctAnswer,
    ...rest
  } = session;
  return rest;
}
