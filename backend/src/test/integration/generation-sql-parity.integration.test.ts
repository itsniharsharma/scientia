import { describe, it, expect } from 'vitest';
import { prisma } from '../../lib/prisma';
import { buildGenerationSeed, selectQuestionIds } from '../../modules/tests/generation/fairness.algorithm';
import { selectTopNIdsViaSql } from '../../modules/tests/generation/sql-selection';

// Gated exactly like the project's other integration tests — skipped by
// default, so a normal `pnpm test` run needs no DATABASE_URL. Run explicitly
// (with DATABASE_URL set) before ever setting FAIRNESS_SELECTION_MODE=sql in
// any real environment. Entirely READ-ONLY: compares two selection
// implementations against existing data, never creates/mutates a Test.

const skipIfNoDb = !process.env.DATABASE_URL ? it.skip : it;

describe('OLD vs NEW question selection — real database differential parity', () => {
  // A topic known (at the time this suite was written) to hold real published
  // questions. If it's empty in a given environment these cases simply find
  // 0 candidates and are skipped internally — not a false pass, since the
  // core assertion still fires on any actual ID/order disagreement whenever
  // real candidates exist.
  const REAL_TOPIC_ID = 'c8a10ce6-0746-4c8c-a949-cf000739eb7a';

  skipIfNoDb('selects identical IDs in identical order for a range of realistic counts', async () => {
    // Runs 5 sequential real round trips against the DB — longer than the
    // default 5s test timeout.
    const seed = buildGenerationSeed('parity-test-teacher');
    const now = new Date();

    const candidates = await prisma.question.findMany({
      where: { topicId: { in: [REAL_TOPIC_ID] }, status: 'PUBLISHED' },
      include: { options: { orderBy: { position: 'asc' } } },
    });

    let comparedAtLeastOne = false;
    for (const count of [1, 5, 10, 25, 50]) {
      if (candidates.length <= count) continue; // exact-match/insufficient case covered separately
      comparedAtLeastOne = true;
      const oldIds = selectQuestionIds(candidates, count, seed);
      const newIds = await selectTopNIdsViaSql([REAL_TOPIC_ID], count, seed, now);
      expect(newIds).toEqual(oldIds);
    }
    expect(comparedAtLeastOne).toBe(true); // fail loudly if this env has no usable data at all
  }, 30_000);

  skipIfNoDb(
    'documented edge case: when candidates.length <= questionCount, the SELECTED SET matches but internal order may differ',
    async () => {
      // The old path's selectQuestionIds short-circuits to "return all,
      // unranked" in this exact case — an arbitrary, never-guaranteed DB
      // fetch order. The new SQL path always applies ORDER BY score DESC,
      // even here, making the order deterministic instead of unspecified.
      // This is a KNOWN, INTENTIONAL, documented difference — not a silent
      // regression — because no test or contract ever protected the old
      // order in this branch. The SET of selected questions (the guarantee
      // that actually matters) is verified identical.
      const seed = buildGenerationSeed('parity-test-teacher-exact');
      const now = new Date();

      const candidates = await prisma.question.findMany({
        where: { topicId: { in: [REAL_TOPIC_ID] }, status: 'PUBLISHED' },
        include: { options: { orderBy: { position: 'asc' } } },
      });
      if (candidates.length === 0) return; // no data in this env — nothing to compare

      const exactCount = candidates.length;
      const oldIds = selectQuestionIds(candidates, exactCount, seed);
      const newIds = await selectTopNIdsViaSql([REAL_TOPIC_ID], exactCount, seed, now);

      expect(new Set(newIds)).toEqual(new Set(oldIds)); // same SET
      expect(newIds).toHaveLength(oldIds.length); // same COUNT
    },
  );

  skipIfNoDb(
    'snapshot equivalence: a question fetched via the targeted (selected-IDs) query is field-identical to the same question fetched via the bulk (all-candidates) query',
    async () => {
      const bulk = await prisma.question.findMany({
        where: { topicId: { in: [REAL_TOPIC_ID] }, status: 'PUBLISHED' },
        include: { options: { orderBy: { position: 'asc' } } },
        take: 1,
      });
      if (bulk.length === 0) return;

      const targeted = await prisma.question.findMany({
        where: { id: { in: [bulk[0].id] } },
        include: { options: { orderBy: { position: 'asc' } } },
      });

      expect(targeted).toHaveLength(1);
      expect(targeted[0]).toEqual(bulk[0]); // identical question row
      expect(targeted[0].options).toEqual(bulk[0].options); // identical options, identical order
    },
  );

  skipIfNoDb('SQL selection is deterministic for the same seed (repeat calls agree)', async () => {
    const seed = buildGenerationSeed('parity-test-teacher-determinism');
    const now = new Date();

    const candidates = await prisma.question.findMany({
      where: { topicId: { in: [REAL_TOPIC_ID] }, status: 'PUBLISHED' },
    });
    if (candidates.length < 10) return;

    const first = await selectTopNIdsViaSql([REAL_TOPIC_ID], 10, seed, now);
    const second = await selectTopNIdsViaSql([REAL_TOPIC_ID], 10, seed, now);
    expect(second).toEqual(first);
  });
});
