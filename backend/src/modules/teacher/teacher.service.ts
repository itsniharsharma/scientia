import { prisma } from '../../lib/prisma';
import { NotFoundError, AppError } from '../../shared/errors';
import { generateLinkToken, storeLinkToken } from '../../teleService/telegram/telegram.link';
import { logger } from '../../shared/logger';
import type { TeacherDto } from '@scientia/types';

/**
 * Generates a one-time Telegram linking token tied to this teacher.
 * The token is stored in Redis with a 15-minute TTL.
 * Requires Redis — throws 503 if Redis is not configured.
 */
export async function generateTelegramLinkToken(
  teacherId: string,
): Promise<{ token: string; expiresAt: string; deepLink: string | null }> {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } });
  if (!teacher) throw new NotFoundError('Teacher not found');

  let token: string;
  try {
    token = generateLinkToken();
    await storeLinkToken(token, teacherId);
  } catch {
    throw new AppError(503, 'Redis is not configured — Telegram linking is unavailable');
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const deepLink = botUsername ? `https://t.me/${botUsername}?start=${token}` : null;

  logger.info('TELEGRAM_LINK_TOKEN_GENERATED', { teacherId });
  return { token, expiresAt, deepLink };
}

export async function getTeacherProfile(teacherId: string): Promise<TeacherDto> {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new NotFoundError('Teacher not found');
  return {
    id: teacher.id,
    username: teacher.username,
    fullName: teacher.fullName,
    phone: teacher.phone,
    email: teacher.email,
    role: 'TEACHER',
    createdAt: teacher.createdAt.toISOString(),
    updatedAt: teacher.updatedAt.toISOString(),
  };
}
