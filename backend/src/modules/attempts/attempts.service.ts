import { prisma } from '../../lib/prisma';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnprocessableError,
} from '../../shared/errors';
import { getCached, invalidate, CACHE_KEYS, TTL } from '../../shared/cache';
import { scoreResponse, computeScore, isAttempted } from './score.service';
import { resolveTestStatus } from '../tests/tests.utils';
import type {
  AttemptDto,
  AttemptWithDetailsDto,
  AttemptTestMeta,
  ResponseDto,
  SelectedAnswer,
  CorrectAnswerSnapshot,
  TestOptionSnapshot,
} from '@scientia/types';
import type { SaveResponsesInput } from '@scientia/validators';
import { Prisma } from '@prisma/client';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

type AttemptRecord = Prisma.AttemptGetPayload<Record<string, never>>;

function toAttemptDto(a: AttemptRecord): AttemptDto {
  return {
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
  };
}

function toResponseDto(r: Prisma.ResponseGetPayload<Record<string, never>>): ResponseDto {
  return {
    id: r.id,
    attemptId: r.attemptId,
    testQuestionId: r.testQuestionId,
    selectedAnswerJson: r.selectedAnswerJson as SelectedAnswer | null,
    isCorrect: r.isCorrect,
    answeredAt: r.answeredAt?.toISOString() ?? null,
  };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAttemptOwner(attemptId: string, studentId: string) {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.studentId !== studentId) throw new ForbiddenError('This is not your attempt');
  return attempt;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function startAttempt(
  studentId: string,
  testId: string,
): Promise<AttemptWithDetailsDto> {
  // Verify test exists and is SCHEDULED
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { testQuestions: { orderBy: { position: 'asc' } } },
  });
  if (!test) throw new NotFoundError('Test not found');
  const resolvedStatus = resolveTestStatus(test);
  if (resolvedStatus === 'COMPLETED') {
    throw new UnprocessableError('This test has ended.');
  }
  if (resolvedStatus !== 'SCHEDULED') {
    throw new UnprocessableError('This test is not open for attempts');
  }
  if (test.testQuestions.length === 0) {
    throw new UnprocessableError('This test has no questions');
  }

  // One attempt per student per test
  const existing = await prisma.attempt.findUnique({
    where: { studentId_testId: { studentId, testId } },
  });
  if (existing) {
    throw new ConflictError('You have already started this test');
  }

  // Create attempt + blank response rows in a transaction
  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.attempt.create({
      data: { studentId, testId },
    });

    await tx.response.createMany({
      data: test.testQuestions.map((tq) => ({
        attemptId: newAttempt.id,
        testQuestionId: tq.id,
      })),
    });

    return newAttempt;
  });

  return buildAttemptWithDetails(attempt, test);
}

export async function getAttempt(
  attemptId: string,
  studentId: string,
): Promise<AttemptWithDetailsDto> {
  const attempt = await requireAttemptOwner(attemptId, studentId);

  const [test, savedResponses] = await Promise.all([
    prisma.test.findUnique({
      where: { id: attempt.testId },
      include: { testQuestions: { orderBy: { position: 'asc' } } },
    }),
    prisma.response.findMany({ where: { attemptId } }),
  ]);

  return buildAttemptWithDetails(attempt, test!, savedResponses);
}

export async function saveResponses(
  attemptId: string,
  studentId: string,
  data: SaveResponsesInput,
): Promise<ResponseDto[]> {
  const attempt = await requireAttemptOwner(attemptId, studentId);
  if (attempt.status !== 'IN_PROGRESS') {
    throw new UnprocessableError('This attempt is no longer active');
  }

  const now = new Date();

  await prisma.$transaction(
    data.responses.map((r) =>
      prisma.response.updateMany({
        where: { attemptId, testQuestionId: r.testQuestionId },
        data: {
          selectedAnswerJson:
            r.selectedAnswerJson !== null
              ? JSON.parse(JSON.stringify(r.selectedAnswerJson))
              : Prisma.JsonNull,
          answeredAt: now,
        },
      }),
    ),
  );

  const updated = await prisma.response.findMany({
    where: { attemptId, testQuestionId: { in: data.responses.map((r) => r.testQuestionId) } },
  });

  return updated.map(toResponseDto);
}

export async function submitAttempt(
  attemptId: string,
  studentId: string,
): Promise<AttemptDto> {
  const attempt = await requireAttemptOwner(attemptId, studentId);
  if (attempt.status !== 'IN_PROGRESS') {
    throw new UnprocessableError('This attempt has already been submitted');
  }

  // Load all responses + their TestQuestion (for correct answers)
  const responses = await prisma.response.findMany({
    where: { attemptId },
    include: {
      testQuestion: true,
    },
  });

  // Compute scores for each response
  const scoringInputs = responses.map((r) => ({
    questionType: r.testQuestion.questionType as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER',
    selected: r.selectedAnswerJson as SelectedAnswer | null,
    correct: r.testQuestion.correctAnswerJson as unknown as CorrectAnswerSnapshot,
  }));

  const { totalScore, correctCount, wrongCount, unattemptedCount } =
    computeScore(scoringInputs);

  // Score each individual response and persist
  const now = new Date();
  await prisma.$transaction(
    responses.map((r) => {
      const { isCorrect } = scoreResponse(
        r.testQuestion.questionType as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER',
        r.selectedAnswerJson as SelectedAnswer | null,
        r.testQuestion.correctAnswerJson as unknown as CorrectAnswerSnapshot,
      );
      return prisma.response.update({
        where: { id: r.id },
        data: { isCorrect: isCorrect ?? false },
      });
    }),
  );

  const finalAttempt = await prisma.attempt.update({
    where: { id: attemptId },
    data: { status: 'SUBMITTED', submittedAt: now, score: totalScore, correctCount, wrongCount, unattemptedCount },
  });

  // Invalidate after DB write succeeds — never before
  await invalidate(
    CACHE_KEYS.analytics(attempt.testId),      // rankings + avg change
    CACHE_KEYS.studentDashboard(studentId),    // recent attempts + stats change
  );

  return toAttemptDto(finalAttempt);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAttemptWithDetails(
  attempt: AttemptRecord,
  test: {
    id: string;
    name: string;
    durationMinutes: number;
    scheduledAt: Date;
    testQuestions: {
      id: string;
      testId: string;
      originalQuestionId: string | null;
      questionText: string | null;
      questionImageUrl: string | null;
      latexContent: string | null;
      questionType: string;
      optionsJson: Prisma.JsonValue;
      correctAnswerJson: Prisma.JsonValue;
      position: number;
      createdAt: Date;
      updatedAt: Date;
    }[];
  },
  savedResponses: Prisma.ResponseGetPayload<Record<string, never>>[] = [],
): AttemptWithDetailsDto {
  const testMeta: AttemptTestMeta = {
    id: test.id,
    name: test.name,
    durationMinutes: test.durationMinutes,
    scheduledAt: test.scheduledAt.toISOString(),
    questionCount: test.testQuestions.length,
  };

  const questions = test.testQuestions.map((tq) => ({
    id: tq.id,
    testId: tq.testId,
    originalQuestionId: tq.originalQuestionId,
    questionText: tq.questionText,
    questionImageUrl: tq.questionImageUrl,
    latexContent: tq.latexContent,
    questionType: tq.questionType as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER',
    optionsJson: tq.optionsJson as unknown as TestOptionSnapshot[],
    correctAnswerJson: tq.correctAnswerJson as unknown as CorrectAnswerSnapshot,
    position: tq.position,
    createdAt: tq.createdAt.toISOString(),
    updatedAt: tq.updatedAt.toISOString(),
  }));

  return {
    ...toAttemptDto(attempt),
    test: testMeta,
    questions,
    responses: savedResponses.map(toResponseDto),
  };
}

// ─── Attempt Review ───────────────────────────────────────────────────────────

export async function getAttemptReview(attemptId: string, studentId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        select: {
          name: true,
          testQuestions: { orderBy: { position: 'asc' } },
        },
      },
      responses: true,
    },
  });

  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.studentId !== studentId) throw new ForbiddenError('This is not your attempt');
  if (attempt.status !== 'SUBMITTED' && attempt.status !== 'EXPIRED') {
    throw new UnprocessableError('Attempt has not been submitted yet');
  }

  // Build a response lookup map: testQuestionId → response
  const responseMap = new Map(attempt.responses.map((r) => [r.testQuestionId, r]));

  const questions = attempt.test.testQuestions.map((tq) => {
    const response = responseMap.get(tq.id) ?? null;
    const selected = (response?.selectedAnswerJson ?? null) as SelectedAnswer | null;
    const correct = tq.correctAnswerJson as unknown as CorrectAnswerSnapshot;
    const options = (tq.optionsJson as unknown as TestOptionSnapshot[])
      .sort((a, b) => a.position - b.position)
      .map((opt) => ({
        id: opt.id,
        position: opt.position,
        optionText: opt.optionText,
        optionImageUrl: opt.optionImageUrl,
        latexContent: opt.latexContent ?? null,
        isCorrect: correct.type === 'choice' ? correct.optionIds.includes(opt.id) : false,
        wasSelected:
          selected?.type === 'choice' ? selected.optionIds.includes(opt.id) : false,
      }));

    // Derive status from selected answer (isCorrect in DB is stored as false for unattempted)
    const status: 'correct' | 'wrong' | 'skipped' =
      selected === null || !isAttempted(selected)
        ? 'skipped'
        : (response?.isCorrect ?? false)
          ? 'correct'
          : 'wrong';

    return {
      id: tq.id,
      position: tq.position,
      questionText: tq.questionText,
      questionImageUrl: tq.questionImageUrl,
      latexContent: tq.latexContent,
      questionType: tq.questionType as 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'INTEGER',
      options,
      selectedAnswer: selected,
      correctAnswer: correct,
      status,
    };
  });

  return {
    attempt: {
      id: attempt.id,
      score: attempt.score,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unattemptedCount: attempt.unattemptedCount,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      testName: attempt.test.name,
    },
    questions,
  };
}

// ─── Student Portal Queries ───────────────────────────────────────────────────

export async function listScheduledTests(studentId: string) {
  const tests = await prisma.test.findMany({
    where: {
      status: 'SCHEDULED',
      OR: [
        // Tests in batches the student belongs to
        { batch: { students: { some: { studentId } } } },
        // Legacy tests with no batch (visible to all students)
        { batchId: null },
      ],
    },
    include: {
      _count: { select: { testQuestions: true } },
      attempts: { where: { studentId }, select: { id: true, status: true } },
      batch: { select: { name: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return tests
    .filter((t) => resolveTestStatus(t) === 'SCHEDULED')
    .map((t) => {
      const attempt = t.attempts[0] ?? null;
      return {
        id: t.id,
        name: t.name,
        batchName: t.batch?.name ?? null,
        scheduledAt: t.scheduledAt.toISOString(),
        durationMinutes: t.durationMinutes,
        questionCount: t._count.testQuestions,
        attempted: !!attempt,
        attemptId: attempt?.id ?? null,
        attemptStatus: (attempt?.status ?? null) as
          | 'IN_PROGRESS'
          | 'SUBMITTED'
          | 'EXPIRED'
          | null,
      };
    });
}

export async function getStudentDashboard(studentId: string) {
  return getCached(
    CACHE_KEYS.studentDashboard(studentId),
    TTL.STUDENT_DASHBOARD,
    async () => {
      const [upcomingTests, recentAttempts, submittedStats] = await Promise.all([
        listScheduledTests(studentId),
        prisma.attempt.findMany({
          where: { studentId, status: { in: ['SUBMITTED', 'EXPIRED'] } },
          include: { test: { select: { name: true, _count: { select: { testQuestions: true } } } } },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        }),
        prisma.attempt.aggregate({
          where: { studentId, status: 'SUBMITTED' },
          _count: { id: true },
          _avg: { score: true },
        }),
      ]);

      const totalAttempts = submittedStats._count.id;
      const averageScore =
        submittedStats._avg.score !== null ? Math.round(submittedStats._avg.score) : null;

      return {
        upcomingTests: upcomingTests.filter((t) => !t.attempted),
        recentAttempts: recentAttempts.map((a) => ({
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
        })),
        stats: { totalAttempts, averageScore },
      };
    },
  );
}
