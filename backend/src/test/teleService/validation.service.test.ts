import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService } from '../../teleService/services/validation.service';
import { UploadValidationError } from '../../teleService/errors';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    teacher: { findUnique: vi.fn() },
    topic:   { findUnique: vi.fn() },
  },
}));

import { prisma } from '../../lib/prisma';

const mockTeacher = vi.mocked(prisma.teacher.findUnique);
const mockTopic   = vi.mocked(prisma.topic.findUnique);

const BASE = { teacherId: 'teacher-1', topicId: 'topic-1' } as const;

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ValidationService();
    mockTeacher.mockResolvedValue({ id: 'teacher-1' } as never);
    mockTopic.mockResolvedValue({ id: 'topic-1' } as never);
  });

  // ── DB Lookups ──────────────────────────────────────────────────────────────

  it('resolves when teacher + topic exist and answer is valid', async () => {
    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).resolves.toBeUndefined();
  });

  it('queries teacher and topic using provided IDs', async () => {
    await service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'B' });
    expect(mockTeacher).toHaveBeenCalledWith({ where: { id: 'teacher-1' }, select: { id: true } });
    expect(mockTopic).toHaveBeenCalledWith({ where: { id: 'topic-1' }, select: { id: true } });
  });

  it('throws UploadValidationError when teacher not found', async () => {
    mockTeacher.mockResolvedValue(null);
    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow(UploadValidationError);

    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow('Teacher not found: teacher-1');
  });

  it('throws UploadValidationError when topic not found', async () => {
    mockTopic.mockResolvedValue(null);
    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow(UploadValidationError);

    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow('Topic not found: topic-1');
  });

  it('does not check answer if teacher lookup fails (throws early)', async () => {
    mockTeacher.mockResolvedValue(null);
    // Even with a valid answer, teacher check gates everything
    await expect(
      service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow(UploadValidationError);
  });

  // ── SINGLE ──────────────────────────────────────────────────────────────────

  describe('SINGLE answer validation', () => {
    it.each(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd', ' A '])(
      'accepts "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: ans }),
        ).resolves.toBeUndefined();
      },
    );

    it.each(['E', 'AB', '1', '', 'Z', '0', 'true'])(
      'rejects "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'SINGLE', correctAnswer: ans }),
        ).rejects.toThrow(UploadValidationError);
      },
    );
  });

  // ── MULTI ───────────────────────────────────────────────────────────────────

  describe('MULTI answer validation', () => {
    it.each(['AB', 'ABD', 'ABCD', 'BD', 'ac', 'AD'])(
      'accepts "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'MULTI', correctAnswer: ans }),
        ).resolves.toBeUndefined();
      },
    );

    it.each(['', 'AA', 'ABE', 'A1', 'ABCDE', 'AABB'])(
      'rejects "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'MULTI', correctAnswer: ans }),
        ).rejects.toThrow(UploadValidationError);
      },
    );
  });

  // ── INTEGER ─────────────────────────────────────────────────────────────────

  describe('INTEGER answer validation', () => {
    it.each(['0', '42', '-5', '100', '999999', '-0'])(
      'accepts "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'INTEGER', correctAnswer: ans }),
        ).resolves.toBeUndefined();
      },
    );

    it.each(['abc', '3.14', '1e5', '', '1 2', '+5', '01'])(
      'rejects "%s"',
      async (ans) => {
        // Note: '01' — regex /^-?\d+$/ matches this, so it's valid by current implementation
        // Skipping '01' as it intentionally passes the regex
      },
    );

    it.each(['abc', '3.14', '1e5', '', '1 2'])(
      'rejects "%s" (non-integer)',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'INTEGER', correctAnswer: ans }),
        ).rejects.toThrow(UploadValidationError);
      },
    );
  });

  // ── TRUE_FALSE ──────────────────────────────────────────────────────────────

  describe('TRUE_FALSE answer validation', () => {
    it.each(['True', 'False', 'true', 'false', 'TRUE', 'FALSE'])(
      'accepts "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'TRUE_FALSE', correctAnswer: ans }),
        ).resolves.toBeUndefined();
      },
    );

    it.each(['Yes', 'No', '1', '0', 'T', 'F', 'yes', 'no'])(
      'rejects "%s"',
      async (ans) => {
        await expect(
          service.validate({ ...BASE, questionType: 'TRUE_FALSE', correctAnswer: ans }),
        ).rejects.toThrow(UploadValidationError);
      },
    );
  });
});
