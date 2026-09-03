import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── FAIRNESS_SELECTION_MODE default-safety unit tests (no DB required) ───────
// These protect the single most important safety property of this migration:
// the SQL path is opt-in only, and the default behavior is byte-for-byte the
// original implementation. Real cross-implementation parity (does SQL select
// the same IDs as JS?) is proven separately, against a live database, in
// src/test/integration/generation-sql-parity.integration.test.ts — kept in a
// SEPARATE file because vi.mock('../lib/prisma') below is file-scoped and
// would otherwise silently intercept a "real DB" test in the same file.

const mockFindMany = vi.fn();
const mockQueryRaw = vi.fn();
const mockTransaction = vi.fn();
const mockTestFindUnique = vi.fn();

vi.mock('../lib/prisma', () => ({
  prisma: {
    question: { findMany: (...args: unknown[]) => mockFindMany(...args) },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    test: { findUnique: (...args: unknown[]) => mockTestFindUnique(...args) },
  },
}));

import { generateAndPersistTest } from '../modules/tests/generation/generation.service';

const FAKE_QUESTION = {
  id: 'q-1',
  topicId: 'topic-1',
  type: 'SINGLE_CHOICE' as const,
  status: 'PUBLISHED' as const,
  questionText: 'Q?',
  questionImageUrl: null,
  latexContent: null,
  integerAnswer: null,
  appearanceCount: 0,
  lastAppearedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  options: [
    { id: 'o-1', questionId: 'q-1', position: 0, optionText: 'A', optionImageUrl: null, latexContent: null, isCorrect: true },
  ],
};

const BASE_INPUT = {
  name: 'Test',
  subjectId: 'subj-1',
  topicIds: ['topic-1'],
  questionCount: 1,
  durationMinutes: 30,
  scheduledAt: new Date().toISOString(),
};

describe('generateAndPersistTest — FAIRNESS_SELECTION_MODE default safety', () => {
  const originalEnv = process.env.FAIRNESS_SELECTION_MODE;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([FAKE_QUESTION]);
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({
        test: { create: vi.fn().mockResolvedValue({ id: 'test-1' }) },
        testQuestion: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
        question: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      }),
    );
    mockTestFindUnique.mockResolvedValue({ id: 'test-1' });
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FAIRNESS_SELECTION_MODE;
    else process.env.FAIRNESS_SELECTION_MODE = originalEnv;
  });

  it('uses the original JS path (never calls $queryRaw) when FAIRNESS_SELECTION_MODE is unset', async () => {
    delete process.env.FAIRNESS_SELECTION_MODE;
    await generateAndPersistTest('teacher-1', BASE_INPUT);
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { topicId: { in: ['topic-1'] }, status: 'PUBLISHED' } }),
    );
  });

  it('uses the original JS path for any value other than exactly "sql"', async () => {
    process.env.FAIRNESS_SELECTION_MODE = 'SQL'; // wrong case — must not match
    await generateAndPersistTest('teacher-1', BASE_INPUT);
    expect(mockQueryRaw).not.toHaveBeenCalled();

    process.env.FAIRNESS_SELECTION_MODE = 'true';
    await generateAndPersistTest('teacher-1', BASE_INPUT);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it('uses the SQL path (calls $queryRaw, never fetches all candidates) only when explicitly set to "sql"', async () => {
    process.env.FAIRNESS_SELECTION_MODE = 'sql';
    mockQueryRaw.mockResolvedValue([{ id: 'q-1' }]);
    await generateAndPersistTest('teacher-1', BASE_INPUT);

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    // The follow-up question fetch must be scoped to the selected IDs only —
    // never the unbounded topicId/status filter used by the old path.
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['q-1'] } } }),
    );
    expect(mockFindMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ topicId: expect.anything() }) }),
    );
  });

  it('SQL path throws the same UnprocessableError shape when too few questions are eligible', async () => {
    process.env.FAIRNESS_SELECTION_MODE = 'sql';
    mockQueryRaw.mockResolvedValue([]); // 0 eligible, 1 requested
    await expect(generateAndPersistTest('teacher-1', BASE_INPUT)).rejects.toThrow(
      'Only 0 published questions available in the selected topics, but 1 requested',
    );
  });

  it('SQL path fails loudly (not a crash) if a selected question vanishes before the follow-up fetch', async () => {
    // Race window unique to the two-step SQL path: IDs selected, then a
    // separate query fetches full data. If a question is deleted/unpublished
    // in between, the follow-up fetch returns fewer rows than selected IDs.
    process.env.FAIRNESS_SELECTION_MODE = 'sql';
    mockQueryRaw.mockResolvedValue([{ id: 'q-1' }]);
    mockFindMany.mockResolvedValue([]); // the targeted fetch finds nothing — question vanished
    await expect(generateAndPersistTest('teacher-1', BASE_INPUT)).rejects.toThrow(
      'One or more selected questions changed during test generation — please try again.',
    );
  });
});
