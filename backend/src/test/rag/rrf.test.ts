import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion } from '../../modules/rag/retrieval/rrf';

describe('reciprocalRankFusion', () => {
  it('ranks an item found near the top of both lists above one found in only one list', () => {
    const fused = reciprocalRankFusion([
      { ids: ['a', 'b', 'c'] },
      { ids: ['b', 'a', 'd'] },
    ]);

    expect(fused[0].id).toBe('a');
    expect(fused.map((f) => f.id)).toContain('b');
  });

  it('never concatenates — a duplicate id across both lists appears exactly once', () => {
    const fused = reciprocalRankFusion([{ ids: ['a', 'b'] }, { ids: ['a', 'c'] }]);
    const ids = fused.map((f) => f.id);
    expect(ids.filter((id) => id === 'a')).toHaveLength(1);
  });

  it('returns an empty list for empty input', () => {
    expect(reciprocalRankFusion([{ ids: [] }, { ids: [] }])).toEqual([]);
  });

  it('rewards appearing in both lists over ranking #1 in only one', () => {
    // 'z' is #2 in both lists; 'x' is #1 but only in list A. RRF sums
    // reciprocal ranks across lists, so being found by both retrieval
    // methods (even at a lower rank each time) outscores a single #1 hit.
    const fused = reciprocalRankFusion([
      { ids: ['x', 'z'] },
      { ids: ['y', 'z'] },
    ]);
    const zScore = fused.find((f) => f.id === 'z')!.score;
    const xScore = fused.find((f) => f.id === 'x')!.score;
    expect(zScore).toBeGreaterThan(xScore);
  });
});
