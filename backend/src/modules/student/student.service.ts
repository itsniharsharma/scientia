import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

export async function listStudentBatches(studentId: string) {
  const enrollments = await prisma.batchStudent.findMany({
    where: { studentId },
    include: {
      batch: {
        include: {
          teacher: { select: { username: true } },
          _count: { select: { students: true, tests: true } },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return enrollments.map((e) => ({
    id: e.batch.id,
    name: e.batch.name,
    teacherUsername: e.batch.teacher.username,
    studentCount: e.batch._count.students,
    testCount: e.batch._count.tests,
    joinedAt: e.joinedAt.toISOString(),
  }));
}

export async function getStudentBatch(batchId: string, studentId: string) {
  const enrollment = await prisma.batchStudent.findUnique({
    where: { batchId_studentId: { batchId, studentId } },
    include: {
      batch: {
        include: {
          teacher: { select: { username: true } },
          _count: { select: { students: true, tests: true } },
        },
      },
    },
  });
  if (!enrollment) throw new ForbiddenError('You are not enrolled in this batch');

  const { batch } = enrollment;
  return {
    id: batch.id,
    name: batch.name,
    teacherUsername: batch.teacher.username,
    studentCount: batch._count.students,
    testCount: batch._count.tests,
    joinedAt: enrollment.joinedAt.toISOString(),
  };
}

export async function getStudentProfile(studentId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new NotFoundError('Student not found');

  return {
    id: student.id,
    username: student.username,
    fullName: student.fullName,
    phone: student.phone,
    role: 'STUDENT' as const,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

export async function listStudentAttempts(studentId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { studentId, status: { in: ['SUBMITTED', 'EXPIRED'] } },
    include: {
      test: { select: { name: true, _count: { select: { testQuestions: true } } } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return attempts.map((a) => ({
    id: a.id,
    studentId: a.studentId,
    testId: a.testId,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt?.toISOString() ?? null,
    status: a.status,
    score: a.score,
    correctCount: a.correctCount,
    wrongCount: a.wrongCount,
    unattemptedCount: a.unattemptedCount,
    testName: a.test.name,
    questionCount: a.test._count.testQuestions,
  }));
}
