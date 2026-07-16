/**
 * Write operations for the Telegram conversation layer.
 * Only the bot's create flows use this — everything else in the teleService
 * remains read-only via telegram.catalog.ts.
 */
import { prisma } from '../../lib/prisma';
import { logger } from '../../shared/logger';

export interface CreateResult { id: string; name: string; }

function isUniqueConstraintError(err: unknown): boolean {
  return (err as { code?: string })?.code === 'P2002';
}

export async function createChapterInBot(
  subjectId: string,
  name: string,
): Promise<CreateResult> {
  try {
    const record = await prisma.chapter.create({
      data:   { subjectId, name },
      select: { id: true, name: true },
    });
    logger.info('TELEGRAM_CHAPTER_CREATED', { subjectId, chapterId: record.id, name });
    return record;
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new Error(`A chapter named "${name}" already exists in this subject.`);
    }
    throw err;
  }
}

export async function createTopicInBot(
  chapterId: string,
  name: string,
): Promise<CreateResult> {
  try {
    const record = await prisma.topic.create({
      data:   { chapterId, name },
      select: { id: true, name: true },
    });
    logger.info('TELEGRAM_TOPIC_CREATED', { chapterId, topicId: record.id, name });
    return record;
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new Error(`A topic named "${name}" already exists in this chapter.`);
    }
    throw err;
  }
}
