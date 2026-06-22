import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, UnprocessableError } from '../../shared/errors';
import { getCached, invalidate, CACHE_KEYS, TTL } from '../../shared/cache';
import { generateAndPersistTest } from './generation/generation.service';
import { resolveTestStatus } from './tests.utils';
import type {
  GenerateTestInput,
  UpdateTestInput,
  UpdateTestQuestionInput,
  AddReplacementQuestionInput,
  ReorderTestQuestionsInput,
  CreateTestQuestionInput,
} from '@scientia/validators';
import type {
  TestDto,
  TestWithQuestionsDto,
  TestQuestionDto,
  TestOptionSnapshot,
  CorrectAnswerSnapshot,
} from '@scientia/types';
import { Prisma } from '@prisma/client';

// ─── DTOs ────────────────────────────────────────────────────────────────────

type TestWithCount = Prisma.TestGetPayload<{
  include: {
    _count: { select: { testQuestions: true } };
    batch: { select: { name: true } };
  };
}>;

type TestWithQuestions = Prisma.TestGetPayload<{
  include: {
    testQuestions: { orderBy: { position: 'asc' } };
    batch: { select: { name: true } };
  };
}>;

type TQ = Prisma.TestQuestionGetPayload<Record<string, never>>;

function toTestDto(t: TestWithCount): TestDto {
  return {
    id: t.id,
    name: t.name,
    teacherId: t.teacherId,
    subjectId: t.subjectId,
    batchId: t.batchId,
    batchName: t.batch?.name ?? null,
    durationMinutes: t.durationMinutes,
    scheduledAt: t.scheduledAt.toISOString(),
    status: resolveTestStatus(t) as TestDto['status'],
    questionCount: t._count.testQuestions,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function toTestQuestionDto(tq: TQ): TestQuestionDto {
  return {
    id: tq.id,
    testId: tq.testId,
    originalQuestionId: tq.originalQuestionId ?? null,
    questionText: tq.questionText,
    questionImageUrl: tq.questionImageUrl,
    latexContent: tq.latexContent,
    questionType: tq.questionType,
    optionsJson: tq.optionsJson as unknown as TestOptionSnapshot[],
    correctAnswerJson: tq.correctAnswerJson as unknown as CorrectAnswerSnapshot,
    position: tq.position,
    createdAt: tq.createdAt.toISOString(),
    updatedAt: tq.updatedAt.toISOString(),
  };
}

function toTestWithQuestionsDto(t: TestWithQuestions): TestWithQuestionsDto {
  return {
    id: t.id,
    name: t.name,
    teacherId: t.teacherId,
    subjectId: t.subjectId,
    batchId: t.batchId,
    batchName: t.batch?.name ?? null,
    durationMinutes: t.durationMinutes,
    scheduledAt: t.scheduledAt.toISOString(),
    status: resolveTestStatus(t) as TestWithQuestionsDto['status'],
    questionCount: t.testQuestions.length,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    questions: t.testQuestions.map(toTestQuestionDto),
  };
}

// ─── Guards ──────────────────────────────────────────────────────────────────

async function requireTestOwner(testId: string, teacherId: string) {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new NotFoundError('Test not found');
  if (test.teacherId !== teacherId) throw new ForbiddenError('You do not own this test');
  return test;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function generateTest(
  teacherId: string,
  data: GenerateTestInput,
): Promise<TestWithQuestionsDto> {
  const raw = await generateAndPersistTest(teacherId, data);
  await invalidate(CACHE_KEYS.teacherTests(teacherId));
  return toTestWithQuestionsDto(raw!);
}

export async function listTests(teacherId: string): Promise<TestDto[]> {
  return getCached(
    CACHE_KEYS.teacherTests(teacherId),
    TTL.TEACHER_TESTS,
    async () => {
      const tests = await prisma.test.findMany({
        where: { teacherId },
        include: {
          _count: { select: { testQuestions: true } },
          batch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return tests.map(toTestDto);
    },
  );
}

export async function getTest(
  testId: string,
  teacherId: string,
): Promise<TestWithQuestionsDto> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      testQuestions: { orderBy: { position: 'asc' } },
      batch: { select: { name: true } },
    },
  });
  if (!test) throw new NotFoundError('Test not found');
  if (test.teacherId !== teacherId) throw new ForbiddenError('You do not own this test');
  return toTestWithQuestionsDto(test);
}

export async function updateTest(
  testId: string,
  teacherId: string,
  data: UpdateTestInput,
): Promise<TestDto> {
  await requireTestOwner(testId, teacherId);
  const updated = await prisma.test.update({
    where: { id: testId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.scheduledAt !== undefined && { scheduledAt: new Date(data.scheduledAt) }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: {
      _count: { select: { testQuestions: true } },
      batch: { select: { name: true } },
    },
  });
  await invalidate(CACHE_KEYS.teacherTests(teacherId));
  return toTestDto(updated);
}

export async function deleteTest(testId: string, teacherId: string): Promise<void> {
  const test = await requireTestOwner(testId, teacherId);
  if (test.status !== 'DRAFT') {
    throw new UnprocessableError('Only DRAFT tests can be deleted');
  }
  await prisma.test.delete({ where: { id: testId } });
  await invalidate(
    CACHE_KEYS.teacherTests(teacherId),
    CACHE_KEYS.analytics(testId),
  );
}

export async function updateTestQuestion(
  testId: string,
  questionId: string,
  teacherId: string,
  data: UpdateTestQuestionInput,
): Promise<TestQuestionDto> {
  // Single query: verify question belongs to test AND test belongs to teacher
  const tq = await prisma.testQuestion.findFirst({
    where: { id: questionId, testId, test: { teacherId } },
  });
  if (!tq) throw new NotFoundError('Test question not found');

  const updated = await prisma.testQuestion.update({
    where: { id: questionId },
    data: {
      ...(data.questionText !== undefined && { questionText: data.questionText }),
      ...(data.questionImageUrl !== undefined && { questionImageUrl: data.questionImageUrl }),
      ...(data.optionsJson !== undefined && { optionsJson: data.optionsJson }),
      ...(data.position !== undefined && { position: data.position }),
    },
  });
  return toTestQuestionDto(updated);
}

export async function deleteTestQuestion(
  testId: string,
  questionId: string,
  teacherId: string,
): Promise<void> {
  const tq = await prisma.testQuestion.findFirst({
    where: { id: questionId, testId, test: { teacherId } },
  });
  if (!tq) throw new NotFoundError('Test question not found');
  await prisma.testQuestion.delete({ where: { id: questionId } });
}

export async function addReplacementQuestion(
  testId: string,
  teacherId: string,
  data: AddReplacementQuestionInput,
): Promise<TestQuestionDto> {
  await requireTestOwner(testId, teacherId);

  const question = await prisma.question.findUnique({
    where: { id: data.originalQuestionId },
    include: { options: { orderBy: { position: 'asc' } } },
  });
  if (!question) throw new NotFoundError('Question not found in question bank');
  if (question.status !== 'PUBLISHED') {
    throw new UnprocessableError('Only published questions can be added to a test');
  }

  const correctAnswer: CorrectAnswerSnapshot =
    question.type === 'INTEGER'
      ? { type: 'integer', value: question.integerAnswer }
      : { type: 'choice', optionIds: question.options.filter((o) => o.isCorrect).map((o) => o.id) };

  const optionsSnap: TestOptionSnapshot[] = question.options.map((o) => ({
    id: o.id,
    position: o.position,
    optionText: o.optionText,
    optionImageUrl: o.optionImageUrl,
    latexContent: o.latexContent,
    isCorrect: o.isCorrect,
  }));

  const tq = await prisma.testQuestion.create({
    data: {
      testId,
      originalQuestionId: question.id,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
      latexContent: question.latexContent,
      questionType: question.type,
      optionsJson: JSON.parse(JSON.stringify(optionsSnap)),
      correctAnswerJson: correctAnswer as object,
      position: data.position,
    },
  });
  return toTestQuestionDto(tq);
}

export async function reorderTestQuestions(
  testId: string,
  teacherId: string,
  data: ReorderTestQuestionsInput,
): Promise<void> {
  const test = await prisma.test.findUnique({ where: { id: testId }, select: { teacherId: true } });
  if (!test) throw new NotFoundError('Test not found');
  if (test.teacherId !== teacherId) throw new ForbiddenError('You do not own this test');

  await prisma.$transaction(
    data.order.map(({ id, position }) =>
      prisma.testQuestion.update({ where: { id, testId }, data: { position } }),
    ),
  );
}

// ─── In-review question authoring ────────────────────────────────────────────

export async function createTestQuestion(
  testId: string,
  teacherId: string,
  data: CreateTestQuestionInput,
): Promise<TestQuestionDto> {
  const [test, agg] = await Promise.all([
    prisma.test.findUnique({ where: { id: testId }, select: { teacherId: true } }),
    prisma.testQuestion.aggregate({ where: { testId }, _max: { position: true } }),
  ]);
  if (!test) throw new NotFoundError('Test not found');
  if (test.teacherId !== teacherId) throw new ForbiddenError('You do not own this test');

  const nextPosition = (agg._max.position ?? 0) + 1;

  if (!data.publishToQuestionBank) {
    const optionsSnap: TestOptionSnapshot[] = (data.options ?? []).map((o) => ({
      id: crypto.randomUUID(),
      position: o.position,
      optionText: o.optionText ?? null,
      optionImageUrl: o.optionImageUrl ?? null,
      latexContent: o.latexContent ?? null,
      isCorrect: o.isCorrect,
    }));

    const correctAnswer: CorrectAnswerSnapshot =
      data.questionType === 'INTEGER'
        ? { type: 'integer', value: data.integerAnswer ?? null }
        : { type: 'choice', optionIds: optionsSnap.filter((o) => o.isCorrect).map((o) => o.id) };

    const tq = await prisma.testQuestion.create({
      data: {
        testId,
        originalQuestionId: null,
        questionText: data.questionText ?? null,
        questionImageUrl: data.questionImageUrl ?? null,
        latexContent: data.latexContent ?? null,
        questionType: data.questionType,
        optionsJson: optionsSnap as unknown as Prisma.InputJsonValue,
        correctAnswerJson: correctAnswer as unknown as Prisma.InputJsonValue,
        position: nextPosition,
      },
    });
    return toTestQuestionDto(tq);
  }

  // Publish path: create Question + Options in transaction, then snapshot
  const tq = await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        topicId: data.topicId!,
        type: data.questionType,
        status: 'PUBLISHED',
        questionText: data.questionText ?? null,
        questionImageUrl: data.questionImageUrl ?? null,
        latexContent: data.latexContent ?? null,
        integerAnswer: data.integerAnswer ?? null,
        options: {
          create: (data.options ?? []).map((o) => ({
            position: o.position,
            optionText: o.optionText ?? null,
            optionImageUrl: o.optionImageUrl ?? null,
            latexContent: o.latexContent ?? null,
            isCorrect: o.isCorrect,
          })),
        },
      },
      include: { options: { orderBy: { position: 'asc' } } },
    });

    const snap: TestOptionSnapshot[] = question.options.map((o) => ({
      id: o.id,
      position: o.position,
      optionText: o.optionText,
      optionImageUrl: o.optionImageUrl,
      latexContent: o.latexContent,
      isCorrect: o.isCorrect,
    }));

    const answer: CorrectAnswerSnapshot =
      question.type === 'INTEGER'
        ? { type: 'integer', value: question.integerAnswer }
        : { type: 'choice', optionIds: snap.filter((o) => o.isCorrect).map((o) => o.id) };

    return tx.testQuestion.create({
      data: {
        testId,
        originalQuestionId: question.id,
        questionText: question.questionText,
        questionImageUrl: question.questionImageUrl,
        latexContent: question.latexContent,
        questionType: question.type,
        optionsJson: snap as unknown as Prisma.InputJsonValue,
        correctAnswerJson: answer as unknown as Prisma.InputJsonValue,
        position: nextPosition,
      },
    });
  });

  return toTestQuestionDto(tq);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getTestAnalytics(testId: string, teacherId: string) {
  // Ownership check always runs against DB — never cached.
  // Prevents any cross-teacher data leakage via shared cache key.
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: { id: true, name: true, teacherId: true },
  });
  if (!test) throw new NotFoundError('Test not found');
  if (test.teacherId !== teacherId) throw new ForbiddenError('You do not own this test');

  // Only the expensive attempt aggregation is cached.
  const aggregation = await getCached(
    CACHE_KEYS.analytics(testId),
    TTL.ANALYTICS,
    async () => {
      const attempts = await prisma.attempt.findMany({
        where: { testId, status: 'SUBMITTED' },
        include: { student: { select: { username: true } } },
        orderBy: { score: 'desc' },
      });

      const students = attempts.map((a) => ({
        username: a.student.username,
        score: a.score ?? 0,
      }));

      const scores = students.map((s) => s.score);

      return {
        summary: {
          highestScore: scores.length > 0 ? Math.max(...scores) : null,
          lowestScore:  scores.length > 0 ? Math.min(...scores) : null,
          averageScore:
            scores.length > 0
              ? parseFloat((scores.reduce((sum, v) => sum + v, 0) / scores.length).toFixed(1))
              : null,
        },
        students,
      };
    },
  );

  return {
    test: { id: test.id, name: test.name }, // always fresh from ownership check
    ...aggregation,
  };
}

export async function getReplacementPool(testId: string, teacherId: string) {
  const test = await requireTestOwner(testId, teacherId);

  const usedIds = (
    await prisma.testQuestion.findMany({ where: { testId }, select: { originalQuestionId: true } })
  )
    .map((tq) => tq.originalQuestionId)
    .filter((id): id is string => id !== null);

  return prisma.question.findMany({
    where: {
      status: 'PUBLISHED',
      id: { notIn: usedIds },
      topic: { chapter: { subjectId: test.subjectId } },
    },
    include: { options: { orderBy: { position: 'asc' } } },
    orderBy: [{ appearanceCount: 'asc' }, { createdAt: 'asc' }],
    take: 100,
  });
}
