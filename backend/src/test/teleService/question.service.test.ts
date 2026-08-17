import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionService } from '../../teleService/services/question.service';
import { UploadDatabaseError } from '../../teleService/errors';
import type { Question } from '@scientia/types';

vi.mock('../../modules/questions/questions.service', () => ({
  createQuestion: vi.fn(),
}));

import { createQuestion } from '../../modules/questions/questions.service';

const mockCreateQuestion = vi.mocked(createQuestion);

const BASE_PARAMS = {
  topicId:   'topic-1',
  secureUrl: 'https://res.cloudinary.com/denbytwkt/image/upload/scientia/questions/topic-1/abc123',
} as const;

function fakeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id:              'question-1',
    type:            'SINGLE_CHOICE',
    questionImageUrl: BASE_PARAMS.secureUrl,
    topicId:         BASE_PARAMS.topicId,
    options:         [],
    integerAnswer:   null,
    createdAt:       new Date(),
    updatedAt:       new Date(),
    ...overrides,
  } as unknown as Question;
}

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new QuestionService();
    mockCreateQuestion.mockResolvedValue(fakeQuestion());
  });

  // ── SINGLE ──────────────────────────────────────────────────────────────────

  describe('SINGLE type', () => {
    it('passes SINGLE_CHOICE db type to createQuestion', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'B' });
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        BASE_PARAMS.topicId,
        expect.objectContaining({ type: 'SINGLE_CHOICE' }),
      );
    });

    it('builds 4 options with only the correct letter marked', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'C' });

      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        position: number; optionText: string; isCorrect: boolean;
      }>;

      expect(options).toHaveLength(4);
      expect(options.find(o => o.optionText === 'Option A')?.isCorrect).toBe(false);
      expect(options.find(o => o.optionText === 'Option B')?.isCorrect).toBe(false);
      expect(options.find(o => o.optionText === 'Option C')?.isCorrect).toBe(true);
      expect(options.find(o => o.optionText === 'Option D')?.isCorrect).toBe(false);
    });

    it('positions options sequentially 0–3', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{ position: number }>;
      expect(options.map(o => o.position)).toEqual([0, 1, 2, 3]);
    });
  });

  // ── MULTI ───────────────────────────────────────────────────────────────────

  describe('MULTI type', () => {
    it('passes MULTI_CHOICE db type', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'MULTI', correctAnswer: 'ABD' });
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        BASE_PARAMS.topicId,
        expect.objectContaining({ type: 'MULTI_CHOICE' }),
      );
    });

    it('marks exactly the selected letters as correct', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'MULTI', correctAnswer: 'ABD' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        optionText: string; isCorrect: boolean;
      }>;

      expect(options.find(o => o.optionText === 'Option A')?.isCorrect).toBe(true);
      expect(options.find(o => o.optionText === 'Option B')?.isCorrect).toBe(true);
      expect(options.find(o => o.optionText === 'Option C')?.isCorrect).toBe(false);
      expect(options.find(o => o.optionText === 'Option D')?.isCorrect).toBe(true);
    });

    it('handles lowercase answer input', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'MULTI', correctAnswer: 'ac' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        optionText: string; isCorrect: boolean;
      }>;

      expect(options.find(o => o.optionText === 'Option A')?.isCorrect).toBe(true);
      expect(options.find(o => o.optionText === 'Option C')?.isCorrect).toBe(true);
      expect(options.find(o => o.optionText === 'Option B')?.isCorrect).toBe(false);
    });
  });

  // ── INTEGER ─────────────────────────────────────────────────────────────────

  describe('INTEGER type', () => {
    it('passes INTEGER db type', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'INTEGER', correctAnswer: '42' });
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        BASE_PARAMS.topicId,
        expect.objectContaining({ type: 'INTEGER' }),
      );
    });

    it('sends empty options array', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'INTEGER', correctAnswer: '42' });
      const call = vi.mocked(createQuestion).mock.calls[0][1];
      expect(call.options).toEqual([]);
    });

    it('converts answer string to integerAnswer number', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'INTEGER', correctAnswer: '42' });
      const call = vi.mocked(createQuestion).mock.calls[0][1];
      expect(call.integerAnswer).toBe(42);
    });

    it('handles negative integers', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'INTEGER', correctAnswer: '-7' });
      const call = vi.mocked(createQuestion).mock.calls[0][1];
      expect(call.integerAnswer).toBe(-7);
    });

    it('sends undefined integerAnswer for non-INTEGER types', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' });
      const call = vi.mocked(createQuestion).mock.calls[0][1];
      expect(call.integerAnswer).toBeUndefined();
    });
  });

  // ── TRUE_FALSE ──────────────────────────────────────────────────────────────

  describe('TRUE_FALSE type', () => {
    it('passes SINGLE_CHOICE db type (stored as 2-option single choice)', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'TRUE_FALSE', correctAnswer: 'True' });
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        BASE_PARAMS.topicId,
        expect.objectContaining({ type: 'SINGLE_CHOICE' }),
      );
    });

    it('builds exactly 2 options: True and False', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'TRUE_FALSE', correctAnswer: 'True' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        optionText: string; isCorrect: boolean; position: number;
      }>;

      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ position: 0, optionText: 'True',  isCorrect: true  });
      expect(options[1]).toEqual({ position: 1, optionText: 'False', isCorrect: false });
    });

    it('marks False as correct when answer is "False"', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'TRUE_FALSE', correctAnswer: 'False' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        optionText: string; isCorrect: boolean;
      }>;

      expect(options.find(o => o.optionText === 'True')?.isCorrect).toBe(false);
      expect(options.find(o => o.optionText === 'False')?.isCorrect).toBe(true);
    });

    it('handles lowercase "true" and "false"', async () => {
      await service.create({ ...BASE_PARAMS, questionType: 'TRUE_FALSE', correctAnswer: 'false' });
      const options = vi.mocked(createQuestion).mock.calls[0][1].options as Array<{
        optionText: string; isCorrect: boolean;
      }>;

      expect(options.find(o => o.optionText === 'False')?.isCorrect).toBe(true);
    });
  });

  // ── Passthrough + Error handling ─────────────────────────────────────────────

  it('forwards secureUrl as questionImageUrl', async () => {
    await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' });
    expect(mockCreateQuestion).toHaveBeenCalledWith(
      BASE_PARAMS.topicId,
      expect.objectContaining({ questionImageUrl: BASE_PARAMS.secureUrl }),
    );
  });

  it('returns the Question returned by createQuestion', async () => {
    const q = fakeQuestion({ id: 'q-custom' });
    mockCreateQuestion.mockResolvedValue(q);
    const result = await service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' });
    expect(result.id).toBe('q-custom');
  });

  it('wraps createQuestion rejection in UploadDatabaseError', async () => {
    mockCreateQuestion.mockRejectedValue(new Error('Unique constraint violation'));
    await expect(
      service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow(UploadDatabaseError);

    await expect(
      service.create({ ...BASE_PARAMS, questionType: 'SINGLE', correctAnswer: 'A' }),
    ).rejects.toThrow('Failed to write question to database');
  });
});
