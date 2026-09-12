import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError, UnprocessableError } from '../../shared/errors';
import { getCached, invalidate, CACHE_KEYS, TTL } from '../../shared/cache';
import { resolveTestStatus } from '../tests/tests.utils';
import { requireTeacherOrgMember } from '../organisations/organisations.service';
import type { CreateBatchInput, UpdateBatchInput, AddStudentToBatchInput } from '@scientia/validators';
import type { BatchDto, BatchDetailDto, BatchStudentDto } from '@scientia/types';
import type { TestDto } from '@scientia/types';
import { Prisma } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireBatchOwner(batchId: string, teacherId: string) {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) throw new NotFoundError('Batch not found');
  if (batch.teacherId !== teacherId) throw new ForbiddenError('You do not own this batch');
  return batch;
}

function toBatchDto(
  b: Prisma.BatchGetPayload<{
    include: { _count: { select: { students: true; tests: true } } };
  }>,
): BatchDto {
  return {
    id: b.id,
    name: b.name,
    teacherId: b.teacherId,
    organisationId: b.organisationId,
    studentCount: b._count.students,
    testCount: b._count.tests,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function listBatches(teacherId: string): Promise<BatchDto[]> {
  return getCached(
    CACHE_KEYS.teacherBatches(teacherId),
    TTL.TEACHER_BATCHES,
    async () => {
      const batches = await prisma.batch.findMany({
        where: { teacherId },
        include: { _count: { select: { students: true, tests: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return batches.map(toBatchDto);
    },
  );
}

export async function createBatch(
  teacherId: string,
  data: CreateBatchInput,
): Promise<BatchDetailDto> {
  // A teacher can only create a batch under an organisation they actually
  // belong to — the organisationId in the request body is never trusted on
  // its own as proof of authorization.
  await requireTeacherOrgMember(teacherId, data.organisationId);

  const batch = await prisma.batch.create({
    data: { name: data.name.trim(), teacherId, organisationId: data.organisationId },
    include: { _count: { select: { students: true, tests: true } } },
  });
  await invalidate(CACHE_KEYS.teacherBatches(teacherId));
  return { ...toBatchDto(batch), students: [] };
}

export async function getBatch(
  batchId: string,
  teacherId: string,
): Promise<BatchDetailDto & { tests: TestDto[] }> {
  await requireBatchOwner(batchId, teacherId);

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      _count: { select: { students: true, tests: true } },
      students: {
        include: { student: { select: { id: true, username: true, fullName: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      tests: {
        include: { _count: { select: { testQuestions: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!batch) throw new NotFoundError('Batch not found');

  const students: BatchStudentDto[] = batch.students.map((bs) => ({
    studentId: bs.student.id,
    username: bs.student.username,
    fullName: bs.student.fullName,
    joinedAt: bs.joinedAt.toISOString(),
  }));

  const tests: TestDto[] = batch.tests.map((t) => ({
    id: t.id,
    name: t.name,
    teacherId: t.teacherId,
    subjectId: t.subjectId,
    batchId: t.batchId,
    batchName: batch.name,
    durationMinutes: t.durationMinutes,
    scheduledAt: t.scheduledAt.toISOString(),
    status: resolveTestStatus(t) as TestDto['status'],
    questionCount: t._count.testQuestions,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return { ...toBatchDto(batch), students, tests };
}

export async function updateBatch(
  batchId: string,
  teacherId: string,
  data: UpdateBatchInput,
): Promise<BatchDto> {
  await requireBatchOwner(batchId, teacherId);
  const updated = await prisma.batch.update({
    where: { id: batchId },
    data: { name: data.name.trim() },
    include: { _count: { select: { students: true, tests: true } } },
  });
  await invalidate(CACHE_KEYS.teacherBatches(teacherId));
  return toBatchDto(updated);
}

export async function addStudentToBatch(
  batchId: string,
  teacherId: string,
  data: AddStudentToBatchInput,
): Promise<BatchStudentDto> {
  const batch = await requireBatchOwner(batchId, teacherId);

  const student = await prisma.student.findUnique({
    where: { username: data.username.trim().toLowerCase() },
  });
  if (!student) throw new NotFoundError(`No student found with username "${data.username}"`);

  // If this batch belongs to an organisation, the student must already be
  // assigned to that same organisation (by a teacher, via the organisation
  // assignment flow) before they can be added to a batch inside it. Legacy
  // batches (organisationId: null) are unaffected — existing behavior for
  // them is unchanged.
  if (batch.organisationId) {
    const membership = await prisma.studentOrganisation.findUnique({
      where: {
        studentId_organisationId: { studentId: student.id, organisationId: batch.organisationId },
      },
    });
    if (!membership) {
      throw new UnprocessableError('Student is not part of this organisation');
    }
  }

  // Let the DB unique constraint do the conflict check instead of a preflight query
  let bs;
  try {
    bs = await prisma.batchStudent.create({
      data: { batchId, studentId: student.id },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      throw new ConflictError('Student is already in this batch');
    }
    throw err;
  }

  await invalidate(
    CACHE_KEYS.teacherBatches(teacherId),   // batch student count changes
    CACHE_KEYS.studentDashboard(student.id), // student now has new tests visible
  );

  return {
    studentId: student.id,
    username: student.username,
    fullName: student.fullName,
    joinedAt: bs.joinedAt.toISOString(),
  };
}

export async function removeStudentFromBatch(
  batchId: string,
  teacherId: string,
  studentId: string,
): Promise<void> {
  await requireBatchOwner(batchId, teacherId);

  const existing = await prisma.batchStudent.findUnique({
    where: { batchId_studentId: { batchId, studentId } },
  });
  if (!existing) throw new NotFoundError('Student not found in this batch');

  await prisma.batchStudent.delete({
    where: { batchId_studentId: { batchId, studentId } },
  });
  await invalidate(
    CACHE_KEYS.teacherBatches(teacherId),    // batch student count changes
    CACHE_KEYS.studentDashboard(studentId),  // student loses access to batch tests
  );
}
