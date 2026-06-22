import { describe, it, expect } from 'vitest';
import { scoreResponse, computeScore } from '../modules/attempts/score.service';

describe('scoreResponse', () => {
  it('scores a correct single-choice answer', () => {
    const result = scoreResponse(
      'SINGLE_CHOICE',
      { type: 'choice', optionIds: ['opt-a'] },
      { type: 'choice', optionIds: ['opt-a'] },
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(4);
  });

  it('scores a wrong single-choice answer', () => {
    const result = scoreResponse(
      'SINGLE_CHOICE',
      { type: 'choice', optionIds: ['opt-b'] },
      { type: 'choice', optionIds: ['opt-a'] },
    );
    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(-1);
  });

  it('scores an unattempted single-choice as 0', () => {
    const result = scoreResponse('SINGLE_CHOICE', null, { type: 'choice', optionIds: ['opt-a'] });
    expect(result.isCorrect).toBeNull();
    expect(result.points).toBe(0);
  });

  it('scores a correct integer answer', () => {
    const result = scoreResponse(
      'INTEGER',
      { type: 'integer', value: 42 },
      { type: 'integer', value: 42 },
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(4);
  });

  it('scores a wrong integer answer', () => {
    const result = scoreResponse(
      'INTEGER',
      { type: 'integer', value: 99 },
      { type: 'integer', value: 42 },
    );
    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(-1);
  });

  it('scores a fully-correct multi-choice answer', () => {
    const result = scoreResponse(
      'MULTI_CHOICE',
      { type: 'choice', optionIds: ['a', 'b'] },
      { type: 'choice', optionIds: ['a', 'b'] },
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(4);
  });

  it('scores a partially-correct multi-choice as wrong', () => {
    const result = scoreResponse(
      'MULTI_CHOICE',
      { type: 'choice', optionIds: ['a'] },
      { type: 'choice', optionIds: ['a', 'b'] },
    );
    expect(result.isCorrect).toBe(false);
  });
});

describe('computeScore', () => {
  it('computes aggregate scores correctly', () => {
    const inputs = [
      {
        questionType: 'SINGLE_CHOICE' as const,
        selected: { type: 'choice' as const, optionIds: ['a'] },
        correct: { type: 'choice' as const, optionIds: ['a'] },
      },
      {
        questionType: 'SINGLE_CHOICE' as const,
        selected: { type: 'choice' as const, optionIds: ['b'] },
        correct: { type: 'choice' as const, optionIds: ['a'] },
      },
      {
        questionType: 'SINGLE_CHOICE' as const,
        selected: null,
        correct: { type: 'choice' as const, optionIds: ['a'] },
      },
    ];

    const result = computeScore(inputs);
    expect(result.correctCount).toBe(1);
    expect(result.wrongCount).toBe(1);
    expect(result.unattemptedCount).toBe(1);
    expect(result.totalScore).toBe(3); // 4 - 1 + 0 = 3
  });
});
