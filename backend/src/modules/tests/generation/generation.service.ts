import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { UnprocessableError } from '../../../shared/errors';
import { logger } from '../../../shared/logger';
import { buildGenerationSeed, selectQuestionIds } from './fairness.algorithm';
import { selectTopNIdsViaSql } from './sql-selection';
import type { GenerateTestInput } from '@scientia/validators';
import type { TestOptionSnapshot, CorrectAnswerSnapshot } from '@scientia/types';

type QuestionWithOptions = Awaited<ReturnType<typeof fetchCandidates>>[number];

async function fetchCandidates(topicIds: string[]) {
  return prisma.question.findMany({
    where: { topicId: { in: topicIds }, status: 'PUBLISHED' },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

// FAIRNESS_SELECTION_MODE=sql opts into database-side ranking (only the N
// selected questions are ever transferred, instead of every published
// candidate in the topic set). Default (unset/any other value) is the
// original, unchanged all-candidates-into-Node path. See sql-selection.ts
// for the full rationale and src/test/generation-sql-parity.test.ts for the
// parity evidence.
async function fetchSelectedViaSql(
  topicIds: string[],
  questionCount: number,
  seed: number,
  now: Date,
): Promise<{ selectedIds: string[]; questionsById: Map<string, QuestionWithOptions> }> {
  const selectedIds = await selectTopNIdsViaSql(topicIds, questionCount, seed, now);

  if (selectedIds.length < questionCount) {
    throw new UnprocessableError(
      `Only ${selectedIds.length} published question${selectedIds.length === 1 ? '' : 's'} available in the selected topics, but ${questionCount} requested`,
    );
  }

  // Second query fetches full data + options ONLY for the N selected IDs —
  // reuses the exact same query shape (and therefore exact same downstream
  // snapshot-building code) as the original path, just scoped to N rows
  // instead of every candidate.
  const questions = await prisma.question.findMany({
    where: { id: { in: selectedIds } },
    include: { options: { orderBy: { position: 'asc' } } },
  });

  // The OLD path selects from data already in memory (one fetch, same
  // objects) — no gap. This path's SQL selection and full-data fetch are two
  // separate queries, so a question deleted/unpublished in between would
  // silently be missing here. Fail loudly with a clear, retryable error
  // instead of letting a later `.get(qId)!` return undefined.
  if (questions.length !== selectedIds.length) {
    throw new UnprocessableError(
      'One or more selected questions changed during test generation — please try again.',
    );
  }

  const questionsById = new Map(questions.map((q) => [q.id, q]));

  return { selectedIds, questionsById };
}

function buildOptionsSnapshot(
  options: QuestionWithOptions['options'],
): TestOptionSnapshot[] {
  return options.map((o) => ({
    id: o.id,
    position: o.position,
    optionText: o.optionText,
    optionImageUrl: o.optionImageUrl,
    latexContent: o.latexContent,
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

  const seed = buildGenerationSeed(teacherId);
  const now = new Date();
  const mode = process.env.FAIRNESS_SELECTION_MODE === 'sql' ? 'sql' : 'js';
  const selectionStartedAt = Date.now();

  let selectedIds: string[];
  let selectedMap: Map<string, QuestionWithOptions>;
  let candidateCount: number | undefined;

  if (mode === 'sql') {
    const sqlResult = await fetchSelectedViaSql(topicIds, questionCount, seed, now);
    selectedIds = sqlResult.selectedIds;
    selectedMap = sqlResult.questionsById;
  } else {
    const candidates = await fetchCandidates(topicIds);
    candidateCount = candidates.length;

    if (candidates.length < questionCount) {
      throw new UnprocessableError(
        `Only ${candidates.length} published question${candidates.length === 1 ? '' : 's'} available in the selected topics, but ${questionCount} requested`,
      );
    }

    selectedIds = selectQuestionIds(candidates, questionCount, seed);
    selectedMap = new Map(candidates.map((q) => [q.id, q]));
  }

  logger.info('TEST_GENERATION_SELECTION', {
    mode,
    teacherId,
    topicCount: topicIds.length,
    requestedCount: questionCount,
    selectedCount: selectedIds.length,
    // Only cheaply known for the JS path (it fetches the full candidate set
    // anyway); the SQL path never materializes a candidate count client-side
    // by design — that's the point of the migration.
    candidateCount,
    durationMs: Date.now() - selectionStartedAt,
  });

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
        latexContent: q.latexContent,
        questionType: q.type,
        optionsJson: buildOptionsSnapshot(q.options) as unknown as Prisma.InputJsonValue,
        correctAnswerJson: buildCorrectAnswerSnapshot(q) as unknown as Prisma.InputJsonValue,
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
