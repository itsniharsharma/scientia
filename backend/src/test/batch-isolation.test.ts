import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Batch isolation: student can only see their own batches ──────────────────

vi.mock('../lib/prisma', () => ({
  prisma: {
    batchStudent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    batch: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';
import { listStudentBatches, getStudentBatch } from '../modules/student/student.service';
import { ForbiddenError } from '../shared/errors';

const STUDENT_A = 'student-a';
const STUDENT_B = 'student-b';
const BATCH_1 = 'batch-1';

describe('listStudentBatches — batch isolation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns only batches the student is enrolled in', async () => {
    (prisma.batchStudent.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        batch: {
          id: BATCH_1,
          name: 'Batch A',
          teacher: { username: 'teacher1' },
          _count: { students: 10, tests: 3 },
        },
        joinedAt: new Date(),
      },
    ]);

    const result = await listStudentBatches(STUDENT_A);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(BATCH_1);
    expect(
      (prisma.batchStudent.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0].where.studentId,
    ).toBe(STUDENT_A);
  });

  it('returns empty list when student has no batches', async () => {
    (prisma.batchStudent.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await listStudentBatches(STUDENT_B);
    expect(result).toHaveLength(0);
  });
});

describe('getStudentBatch — cross-batch access prevention', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws ForbiddenError when student is not enrolled in the batch', async () => {
    (prisma.batchStudent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(getStudentBatch(BATCH_1, STUDENT_B)).rejects.toThrow(ForbiddenError);
  });

  it('returns batch details when student is enrolled', async () => {
    (prisma.batchStudent.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      joinedAt: new Date(),
      batch: {
        id: BATCH_1,
        name: 'Batch A',
        teacher: { username: 'teacher1' },
        _count: { students: 5, tests: 2 },
      },
    });

    const result = await getStudentBatch(BATCH_1, STUDENT_A);
    expect(result.id).toBe(BATCH_1);
    expect(result.name).toBe('Batch A');
  });
});
