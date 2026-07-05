import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../shared/errors';
import { handleUniqueConstraint } from '../../shared/prisma-errors';
import { getChapterById } from '../chapters/chapters.service';
import type { CreateTopicInput, UpdateTopicInput } from '@scientia/validators';
import type { Topic } from '@scientia/types';

function toDto(record: {
  id: string;
  chapterId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): Topic {
  return {
    id: record.id,
    chapterId: record.chapterId,
    name: record.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getAllTopics(chapterId: string): Promise<Topic[]> {
  await getChapterById(chapterId);
  const records = await prisma.topic.findMany({
    where: { chapterId },
    orderBy: { name: 'asc' },
  });
  return records.map(toDto);
}

export async function getTopicById(id: string): Promise<Topic> {
  const record = await prisma.topic.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError('Topic not found');
  }
  return toDto(record);
}

export async function createTopic(
  chapterId: string,
  data: CreateTopicInput,
): Promise<Topic> {
  await getChapterById(chapterId);
  try {
    const record = await prisma.topic.create({
      data: { chapterId, name: data.name },
    });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(`A topic named "${data.name}" already exists in this chapter`, err);
  }
}

export async function updateTopic(
  id: string,
  data: UpdateTopicInput,
): Promise<Topic> {
  await getTopicById(id);
  try {
    const record = await prisma.topic.update({
      where: { id },
      data: { name: data.name },
    });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(`A topic named "${data.name}" already exists in this chapter`, err);
  }
}

export async function deleteTopic(id: string): Promise<void> {
  await getTopicById(id);
  try {
    await prisma.topic.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      throw new ConflictError('Cannot delete topic: it has existing questions');
    }
    throw err;
  }
}
