import { describe, it, expect } from 'vitest';
import {
  computeFairnessScore,
  buildGenerationSeed,
  selectQuestionIds,
} from '../modules/tests/generation/fairness.algorithm';

// ─── Unit tests for the algorithm that decides which questions students see ───
// This had zero prior test coverage despite being the core fairness guarantee
// the platform advertises (frequency + recency weighted rotation).

describe('computeFairnessScore', () => {
  it('gives a never-used question the maximum recency component (1.0)', () => {
    const score = computeFairnessScore('q1', 0, null, 12345);
    // frequencyScore=1, recencyScore=1 → 0.5*1 + 0.4*1 + jitter(<=0.1) => in [0.9, 1.0]
    expect(score).toBeGreaterThanOrEqual(0.9);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('penalises a heavily-reused question via the frequency component', () => {
    const fresh = computeFairnessScore('q1', 0, null, 12345);
    const heavilyUsed = computeFairnessScore('q1', 99, null, 12345);
    expect(heavilyUsed).toBeLessThan(fresh);
  });

  it('rewards a question that has aged out of recent rotation', () => {
    const justUsed = computeFairnessScore('q1', 5, new Date(), 12345);
    const usedLongAgo = computeFairnessScore(
      'q1',
      5,
      new Date(Date.now() - 90 * 86_400_000), // 90 days ago
      12345,
    );
    expect(usedLongAgo).toBeGreaterThan(justUsed);
  });

  it('is deterministic — same inputs always produce the same score', () => {
    const a = computeFairnessScore('question-x', 3, new Date('2026-01-01'), 999);
    const b = computeFairnessScore('question-x', 3, new Date('2026-01-01'), 999);
    expect(a).toBe(b);
  });

  it('produces different jitter for different question IDs at the same seed (breaks ties)', () => {
    const scoreA = computeFairnessScore('question-a', 5, null, 999);
    const scoreB = computeFairnessScore('question-b', 5, null, 999);
    // Same frequency/recency components — any difference is purely jitter.
    expect(scoreA).not.toBe(scoreB);
  });

  it('keeps every score within the theoretical bounds [0, 1.0]', () => {
    const cases: Array<[number, Date | null]> = [
      [0, null],
      [1000, null],
      [0, new Date()],
      [50, new Date(Date.now() - 365 * 86_400_000)],
    ];
    for (const [count, last] of cases) {
      const s = computeFairnessScore('q', count, last, 42);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('buildGenerationSeed', () => {
  it('produces different seeds for different teachers at the same instant', () => {
    const seedA = buildGenerationSeed('teacher-a');
    const seedB = buildGenerationSeed('teacher-b');
    expect(seedA).not.toBe(seedB);
  });

  it('is stable for the same teacher within the same minute bucket', () => {
    const seedA = buildGenerationSeed('teacher-a');
    const seedB = buildGenerationSeed('teacher-a');
    expect(seedA).toBe(seedB);
  });
});

describe('selectQuestionIds', () => {
  const candidate = (id: string, appearanceCount = 0, lastAppearedAt: Date | null = null) => ({
    id,
    appearanceCount,
    lastAppearedAt,
  });

  it('returns exactly `count` question IDs when there are more candidates than requested', () => {
    const candidates = Array.from({ length: 20 }, (_, i) => candidate(`q${i}`));
    const selected = selectQuestionIds(candidates, 5, 111);
    expect(selected).toHaveLength(5);
  });

  it('returns all candidate IDs unchanged when candidates.length <= count', () => {
    const candidates = [candidate('a'), candidate('b'), candidate('c')];
    const selected = selectQuestionIds(candidates, 5, 111);
    expect(selected.sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns no duplicate IDs', () => {
    const candidates = Array.from({ length: 30 }, (_, i) => candidate(`q${i}`));
    const selected = selectQuestionIds(candidates, 10, 111);
    expect(new Set(selected).size).toBe(selected.length);
  });

  it('is deterministic — the same candidate set + seed always yields the same selection', () => {
    const candidates = Array.from({ length: 15 }, (_, i) =>
      candidate(`q${i}`, i, i % 3 === 0 ? new Date(Date.now() - i * 86_400_000) : null),
    );
    const first = selectQuestionIds(candidates, 5, 42);
    const second = selectQuestionIds(candidates, 5, 42);
    expect(first).toEqual(second);
  });

  it('prefers never-used questions over heavily-reused ones when count forces a choice', () => {
    // 1 fresh question competing against 9 heavily-used ones for 1 of 10 slots kept at 1.
    const fresh = candidate('fresh', 0, null);
    const heavilyUsed = Array.from({ length: 9 }, (_, i) => candidate(`used-${i}`, 500, new Date()));
    const selected = selectQuestionIds([fresh, ...heavilyUsed], 1, 42);
    expect(selected).toEqual(['fresh']);
  });
});
