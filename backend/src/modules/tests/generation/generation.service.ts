import { prisma } from '../../../lib/prisma';
import { UnprocessableError } from '../../../shared/errors';
import { buildGenerationSeed, selectQuestionIds } from './fairness.algorithm';
import type { GenerateTestInput } from '@scientia/validators';
import type { TestOptionSnapshot, CorrectAnswerSnapshot } from '@scientia/types';

type QuestionWithOptions = Awaited<ReturnType<typeof fetchCandidates>>[number];

async function fetchCandidates(topicIds: string[]) {
  return prisma.question.findMany({
    where: { topicId: { in: topicIds }, status: 'PUBLISHED' },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

function buildOptionsSnapshot(
  options: QuestionWithOptions['options'],
): TestOptionSnapshot[] {
  return options.map((o) => ({
    id: o.id,
    position: o.position,
    optionText: o.optionText,
    optionImageUrl: o.optionImageUrl,
    isCorrect: o.isCorrect,
  }));
}

function buildCorrectAnswerSnapshot(
  question: QuestionWithOptions,
): CorrectAnswerSnapshot {
  if (question.type === 'INTEGER') {
    return { type: 'integer', value: question.integerAnswer };
  }
  return {
    type: 'choice',
    optionIds: question.options.filter((o) => o.isCorrect).map((o) => o.id),
  };
}

export async function generateAndPersistTest(
  teacherId: string,
  data: GenerateTestInput,
) {
  const { name, subjectId, topicIds, questionCount, durationMinutes, scheduledAt, batchId } = data;

  const candidates = await fetchCandidates(topicIds);

  if (candidates.length < questionCount) {
    throw new UnprocessableError(
      `Only ${candidates.length} published question${candidates.length === 1 ? '' : 's'} available in the selected topics, but ${questionCount} requested`,
    );
  }

  const seed = buildGenerationSeed(teacherId);
  const selectedIds = selectQuestionIds(candidates, questionCount, seed);
  const selectedMap = new Map(candidates.map((q) => [q.id, q]));

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the test
    const test = await tx.test.create({
      data: {
        name,
        teacherId,
        subjectId,
        batchId: batchId ?? null,
        durationMinutes,
        scheduledAt: new Date(scheduledAt),
        status: 'DRAFT',
      },
    });

    // 2. Snapshot each selected question
    const snapshotData = selectedIds.map((qId, index) => {
      const q = selectedMap.get(qId)!;
      return {
        testId: test.id,
        originalQuestionId: qId,
        questionText: q.questionText,
        questionImageUrl: q.questionImageUrl,
        questionType: q.type,
        optionsJson: JSON.parse(JSON.stringify(buildOptionsSnapshot(q.options))),
        correctAnswerJson: JSON.parse(JSON.stringify(buildCorrectAnswerSnapshot(q))),
        position: index + 1,
      };
    });

    await tx.testQuestion.createMany({ data: snapshotData });

    // 3. Update fairness counters
    await tx.question.updateMany({
      where: { id: { in: selectedIds } },
      data: { appearanceCount: { increment: 1 }, lastAppearedAt: now },
    });

    return test;
  });

  // Return test with questions and batch
  return prisma.test.findUnique({
    where: { id: result.id },
    include: {
      testQuestions: { orderBy: { position: 'asc' } },
      batch: { select: { name: true } },
    },
  });
}
