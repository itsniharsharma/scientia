// Reciprocal Rank Fusion — combines multiple ranked ID lists (dense, sparse)
// into one fused ranking. Rank-based, not raw-score-based, which is exactly
// why it works across two retrieval methods with incomparable score scales
// (cosine similarity vs. BM25).

const DEFAULT_K = 60;

export interface RankedList {
  ids: string[];
}

export interface FusedResult {
  id: string;
  score: number;
}

export function reciprocalRankFusion(lists: RankedList[], k: number = DEFAULT_K): FusedResult[] {
  const scores = new Map<string, number>();

  for (const list of lists) {
    list.ids.forEach((id, index) => {
      const rank = index + 1;
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank));
    });
  }

  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}
