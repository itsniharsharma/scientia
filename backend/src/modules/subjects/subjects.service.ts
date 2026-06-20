import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../shared/errors';
import type { CreateSubjectInput, UpdateSubjectInput } from '@scientia/validators';
import type { Subject } from '@scientia/types';

function toDto(record: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): Subject {
  return {
    id: record.id,
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
    throw new ConflictError(`A subject named "${name}" already exists`);
  }
  throw err;
}

export async function getAllSubjects(): Promise<Subject[]> {
  const records = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });
  return records.map(toDto);
}

export async function getSubjectById(id: string): Promise<Subject> {
  const record = await prisma.subject.findUnique({ where: { id } });
  if (!record) {
    throw new NotFoundError('Subject not found');
  }
  return toDto(record);
}

export async function createSubject(data: CreateSubjectInput): Promise<Subject> {
  const name = data.name.trim();
  try {
    const record = await prisma.subject.create({ data: { name } });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(name, err);
  }
}

export async function updateSubject(
  id: string,
  data: UpdateSubjectInput,
): Promise<Subject> {
  await getSubjectById(id);
  const name = data.name.trim();
  try {
    const record = await prisma.subject.update({
      where: { id },
      data: { name },
    });
    return toDto(record);
  } catch (err) {
    return handleUniqueConstraint(name, err);
  }
}

export async function deleteSubject(id: string): Promise<void> {
  await getSubjectById(id);
  try {
    await prisma.subject.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      throw new ConflictError(
        'Cannot delete subject: it has existing chapters',
      );
    }
    throw err;
  }
}
