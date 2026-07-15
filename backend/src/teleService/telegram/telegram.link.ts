import { randomBytes } from 'crypto';
import { redis } from '../../lib/redis';
import { prisma } from '../../lib/prisma';
import { logger } from '../../shared/logger';

const LINK_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const linkKey = (token: string) => `tg:link:${token}`;

/** Generates a 48-character hex token — cryptographically random, never logged. */
export function generateLinkToken(): string {
  return randomBytes(24).toString('hex');
}

/** Stores the token in Redis tied to the teacherId. Throws if Redis is not configured. */
export async function storeLinkToken(token: string, teacherId: string): Promise<void> {
  if (!redis) throw new Error('Redis is required for Telegram account linking');
  await redis.set(linkKey(token), teacherId, { ex: LINK_TOKEN_TTL_SECONDS });
}

/**
 * Validates and atomically consumes a linking token (one-time use).
 * Returns the teacherId if the token is valid, null if expired or invalid.
 * Any subsequent call with the same token returns null.
 */
export async function consumeLinkToken(token: string): Promise<string | null> {
  if (!redis) return null;
  try {
    const teacherId = await redis.get<string>(linkKey(token));
    if (!teacherId) return null;
    await redis.del(linkKey(token)); // invalidate immediately — one-time use
    return teacherId;
  } catch (err) {
    logger.error('TELEGRAM_LINK_CONSUME_ERROR', { error: String(err) });
    return null;
  }
}

/**
 * Writes the telegramUserId onto the Teacher record.
 * Idempotent if the same telegramUserId is already set.
 * Throws if the account is already linked to a different Telegram user.
 */
export async function linkTeacherToTelegram(
  teacherId: string,
  telegramUserId: string,
): Promise<{ id: string; username: string }> {
  const teacher = await prisma.teacher.findUnique({
    where:  { id: teacherId },
    select: { id: true, username: true, telegramUserId: true },
  });

  if (!teacher) throw new Error(`Teacher not found: ${teacherId}`);

  if (teacher.telegramUserId && teacher.telegramUserId !== telegramUserId) {
    logger.warn('TELEGRAM_LINK_CONFLICT', {
      teacherId,
      existingTelegramId: teacher.telegramUserId,
      attemptedTelegramId: telegramUserId,
    });
    throw new Error('This teacher account is already linked to a different Telegram account');
  }

  if (teacher.telegramUserId !== telegramUserId) {
    await prisma.teacher.update({ where: { id: teacherId }, data: { telegramUserId } });
    logger.info('TEACHER_TELEGRAM_LINKED', { teacherId, telegramUserId });
  }

  return { id: teacher.id, username: teacher.username };
}
