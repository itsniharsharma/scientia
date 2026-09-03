import { describe, it, expect } from 'vitest';
import { validateAnswerRules } from '../modules/questions/answers.service';
import { UnprocessableError } from '../shared/errors';

// ─── Unit tests for the answer-shape guard that gates every question write ────
// This is the safety net enforced inside questions.service.ts's createQuestion
// and updateQuestion (including the Telegram bot's direct-to-PUBLISHED path,
// which bypasses the HTTP-layer Zod schema entirely) — a question with a
// malformed answer must never be persisted, published or not.

describe('validateAnswerRules', () => {
  describe('SINGLE_CHOICE', () => {
    it('accepts exactly one correct option', () => {
      expect(() =>
        validateAnswerRules(
          'SINGLE_CHOICE',
          [{ isCorrect: false }, { isCorrect: true }, { isCorrect: false }],
          undefined,
        ),
      ).not.toThrow();
    });

    it('rejects zero correct options', () => {
      expect(() =>
        validateAnswerRules('SINGLE_CHOICE', [{ isCorrect: false }, { isCorrect: false }], undefined),
      ).toThrow(UnprocessableError);
    });

    it('rejects more than one correct option', () => {
      expect(() =>
        validateAnswerRules('SINGLE_CHOICE', [{ isCorrect: true }, { isCorrect: true }], undefined),
      ).toThrow(UnprocessableError);
    });

    it('rejects an empty options array', () => {
      expect(() => validateAnswerRules('SINGLE_CHOICE', [], undefined)).toThrow(UnprocessableError);
    });

    it('rejects missing options entirely', () => {
      expect(() => validateAnswerRules('SINGLE_CHOICE', undefined, undefined)).toThrow(UnprocessableError);
      expect(() => validateAnswerRules('SINGLE_CHOICE', null, undefined)).toThrow(UnprocessableError);
    });

    it('rejects an integerAnswer being set on a choice question', () => {
      expect(() =>
        validateAnswerRules('SINGLE_CHOICE', [{ isCorrect: true }], 42),
      ).toThrow(UnprocessableError);
    });
  });

  describe('MULTI_CHOICE', () => {
    it('accepts one correct option', () => {
      expect(() =>
        validateAnswerRules('MULTI_CHOICE', [{ isCorrect: true }, { isCorrect: false }], undefined),
      ).not.toThrow();
    });

    it('accepts multiple correct options', () => {
      expect(() =>
        validateAnswerRules(
          'MULTI_CHOICE',
          [{ isCorrect: true }, { isCorrect: true }, { isCorrect: false }],
          undefined,
        ),
      ).not.toThrow();
    });

    it('rejects zero correct options', () => {
      expect(() =>
        validateAnswerRules('MULTI_CHOICE', [{ isCorrect: false }, { isCorrect: false }], undefined),
      ).toThrow(UnprocessableError);
    });

    it('rejects an empty options array', () => {
      expect(() => validateAnswerRules('MULTI_CHOICE', [], undefined)).toThrow(UnprocessableError);
    });
  });

  describe('INTEGER', () => {
    it('accepts a valid integerAnswer with no options', () => {
      expect(() => validateAnswerRules('INTEGER', undefined, 42)).not.toThrow();
      expect(() => validateAnswerRules('INTEGER', [], 0)).not.toThrow();
      expect(() => validateAnswerRules('INTEGER', undefined, -7)).not.toThrow();
    });

    it('rejects a missing integerAnswer', () => {
      expect(() => validateAnswerRules('INTEGER', undefined, undefined)).toThrow(UnprocessableError);
      expect(() => validateAnswerRules('INTEGER', undefined, null)).toThrow(UnprocessableError);
    });

    it('rejects options being attached to an INTEGER question', () => {
      expect(() =>
        validateAnswerRules('INTEGER', [{ isCorrect: true }], 42),
      ).toThrow(UnprocessableError);
    });
  });
});
