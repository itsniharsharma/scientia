import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, UnprocessableError } from '../../shared/errors';
import { generateAndPersistTest } from './generation/generation.service';
import type {
  GenerateTestInput,
  UpdateTestInput,
  UpdateTestQuestionInput,
  AddReplacementQuestionInput,
  ReorderTestQuestionsInput,
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
  include: { _count: { select: { testQuestions: true } } };
}>;

type TestWithQuestions = Prisma.TestGetPayload<{
  include: { testQuestions: { orderBy: { position: 'asc' } } };
}>;

type TQ = Prisma.TestQuestionGetPayload<Record<string, never>>;

function toTestDto(t: TestWithCount): TestDto {
  return {
    id: t.id,
    name: t.name,
    teacherId: t.teacherId,
    subjectId: t.subjectId,
    durationMinutes: t.durationMinutes,
    scheduledAt: t.scheduledAt.toISOString(),
    status: t.status,
    questionCount: t._count.testQuestions,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function toTestQuestionDto(tq: TQ): TestQuestionDto {
  return {
    id: tq.id,
    testId: tq.testId,
    originalQuestionId: tq.originalQuestionId,
    questionText: tq.questionText,
    questionImageUrl: tq.questionImageUrl,
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
    durationMinutes: t.durationMinutes,
    scheduledAt: t.scheduledAt.toISOString(),
    status: t.status,
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
  return toTestWithQuestionsDto(raw!);
}

export async function listTests(teacherId: string): Promise<TestDto[]> {
  const tests = await prisma.test.findMany({
    where: { teacherId },
    include: { _count: { select: { testQuestions: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return tests.map(toTestDto);
}

export async function getTest(
  testId: string,
  teacherId: string,
): Promise<TestWithQuestionsDto> {
  await requireTestOwner(testId, teacherId);
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { testQuestions: { orderBy: { position: 'asc' } } },
  });
  return toTestWithQuestionsDto(test!);
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
    include: { _count: { select: { testQuestions: true } } },
  });
  return toTestDto(updated);
}

export async function deleteTest(testId: string, teacherId: string): Promise<void> {
  const test = await requireTestOwner(testId, teacherId);
  if (test.status !== 'DRAFT') {
    throw new UnprocessableError('Only DRAFT tests can be deleted');
  }
  await prisma.test.delete({ where: { id: testId } });
}

export async function updateTestQuestion(
  testId: string,
  questionId: string,
  teacherId: string,
  data: UpdateTestQuestionInput,
): Promise<TestQuestionDto> {
  await requireTestOwner(testId, teacherId);
  const tq = await prisma.testQuestion.findFirst({ where: { id: questionId, testId } });
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
  await requireTestOwner(testId, teacherId);
  const tq = await prisma.testQuestion.findFirst({ where: { id: questionId, testId } });
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
    isCorrect: o.isCorrect,
  }));

  const tq = await prisma.testQuestion.create({
    data: {
      testId,
      originalQuestionId: question.id,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
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
  await requireTestOwner(testId, teacherId);
  await prisma.$transaction(
    data.order.map(({ id, position }) =>
      prisma.testQuestion.update({ where: { id }, data: { position } }),
    ),
  );
}

export async function getReplacementPool(testId: string, teacherId: string) {
  const test = await requireTestOwner(testId, teacherId);

  const usedIds = (
    await prisma.testQuestion.findMany({ where: { testId }, select: { originalQuestionId: true } })
  ).map((tq) => tq.originalQuestionId);

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
