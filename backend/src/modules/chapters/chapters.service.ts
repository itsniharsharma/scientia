import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../shared/errors';
import { getSubjectById } from '../subjects/subjects.service';
import type { CreateChapterInput, UpdateChapterInput } from '@scientia/validators';
import type { Chapter } from '@scientia/types';

function toDto(record: {
  id: string;
  subjectId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): Chapter {
  return {
    id: record.id,
    subjectId: record.subjectId,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function handleUniqueConstraint(name: string, err: unknown): never {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    throw new ConflictError(
      `A chapter named "${name}" already exists in this subject`,
    );
  }
  throw err;
}

export async function getAllChapters(subjectId: string): Promise<Chapter[]> {
  await getSubjectById(subjectId);
  const records = await prisma.chapter.findMany({
    where: { subjectId },
    orderBy: { name: 'asc' },
  });
  return records.map(toDto);
}

export async function getChapterById(id: string): Promise<Chapter> {
  const record = await prisma.chapter.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError('Chapter not found');
  }
  return toDto(record);
}

export async function createChapter(
  subjectId: string,
  data: CreateChapterInput,
): Promise<Chapter> {
  await getSubjectById(subjectId);
  const name = data.name.trim();
  try {
    const record = await prisma.chapter.create({
      data: { subjectId, name },
    });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(name, err);
  }
}

export async function updateChapter(
  id: string,
  data: UpdateChapterInput,
): Promise<Chapter> {
  await getChapterById(id);
  const name = data.name.trim();
  try {
    const record = await prisma.chapter.update({
      where: { id },
      data: { name },
    });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(name, err);
  }
}

export async function deleteChapter(id: string): Promise<void> {
  await getChapterById(id);
  try {
    await prisma.chapter.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      throw new ConflictError(
        'Cannot delete chapter: it has existing topics',
      );
    }
    throw err;
  }
}
