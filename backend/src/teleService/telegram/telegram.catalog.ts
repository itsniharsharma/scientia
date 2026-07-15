/**
 * Read-only DB catalog for the Telegram conversation layer.
 * Telegram handlers import from here — never from Prisma directly.
 * Keeps the upload pipeline (UploadService and friends) fully isolated.
 */
import { prisma } from '../../lib/prisma';

export interface CatalogSubject { id: string; name: string; }
export interface CatalogChapter { id: string; name: string; subjectId: string; }
export interface CatalogTopic   { id: string; name: string; chapterId: string; }
export interface CatalogTeacher { id: string; username: string; }

// ── Subject queries ───────────────────────────────────────────────────────────

export async function getSubjects(): Promise<CatalogSubject[]> {
  return prisma.subject.findMany({
    orderBy: { name: 'asc' },
    select:  { id: true, name: true },
  });
}

export async function getSubjectById(id: string): Promise<CatalogSubject | null> {
  return prisma.subject.findUnique({
    where:  { id },
    select: { id: true, name: true },
  });
}

// ── Chapter queries ───────────────────────────────────────────────────────────

export async function getChaptersBySubject(subjectId: string): Promise<CatalogChapter[]> {
  return prisma.chapter.findMany({
    where:   { subjectId },
    orderBy: { name: 'asc' },
    select:  { id: true, name: true, subjectId: true },
  });
}

export async function getChapterById(id: string): Promise<CatalogChapter | null> {
  return prisma.chapter.findUnique({
    where:  { id },
    select: { id: true, name: true, subjectId: true },
  });
}

// ── Topic queries ─────────────────────────────────────────────────────────────

export async function getTopicsByChapter(chapterId: string): Promise<CatalogTopic[]> {
  return prisma.topic.findMany({
    where:   { chapterId },
    orderBy: { name: 'asc' },
    select:  { id: true, name: true, chapterId: true },
  });
}

export async function getTopicById(id: string): Promise<CatalogTopic | null> {
  return prisma.topic.findUnique({
    where:  { id },
    select: { id: true, name: true, chapterId: true },
  });
}

// ── Teacher identity ──────────────────────────────────────────────────────────

export async function getTeacherByTelegramUserId(
  telegramUserId: string,
): Promise<CatalogTeacher | null> {
  return prisma.teacher.findUnique({
    where:  { telegramUserId },
    select: { id: true, username: true },
  });
}

// ── Upload stats ──────────────────────────────────────────────────────────────

export async function countTodayUploads(teacherId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.uploadJob.count({
    where: {
      teacherId,
      status:    'COMPLETED',
      createdAt: { gte: startOfDay },
    },
  });
}
