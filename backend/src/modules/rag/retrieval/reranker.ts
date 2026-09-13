import type { ScoredChunk } from '../core/types';

/** Reranking is optional by design — the system must work correctly with
 *  NoOpReranker alone, with no paid API required to function. */
export interface RerankerProvider {
  rerank(query: string, candidates: ScoredChunk[]): Promise<ScoredChunk[]>;
}

export class NoOpReranker implements RerankerProvider {
  async rerank(_query: string, candidates: ScoredChunk[]): Promise<ScoredChunk[]> {
    return candidates;
  }
}
