import type { EmbeddingProvider } from '../embeddings/embedding-provider';
import type { VectorStore, VectorSearchResult } from '../vector/vector-store';
import type { BM25Index } from '../sparse/bm25-index';
import type { RerankerProvider } from './reranker';
import type { ScoredChunk } from '../core/types';
import { reciprocalRankFusion } from './rrf';

export interface RetrievalTopK {
  dense: number;
  sparse: number;
  fused: number;
  final: number;
  /** A dense hit below this cosine score is dropped as noise UNLESS it also
   *  matched via sparse/BM25 (a literal term match is meaningful on its own
   *  regardless of score). Without this, dense search always returns its
   *  top-K regardless of how weak the match is, so a genuinely off-topic
   *  question would still retrieve *something* and get answered from
   *  irrelevant context instead of correctly reporting insufficient
   *  evidence. */
  minDenseScore: number;
  /** Same idea as minDenseScore but for BM25: a term that appears in almost
   *  every chunk (e.g. the product name itself) gets a low but nonzero
   *  score from a low IDF — "present" isn't the same as "discriminating".
   *  A sparse hit below this floor only survives if dense also found it. */
  minSparseScore: number;
}

export interface RetrievalDependencies {
  embeddingProvider: EmbeddingProvider;
  vectorStore: VectorStore;
  bm25Index: BM25Index;
  reranker: RerankerProvider;
  /** documentId -> currently active version. A brief window can exist
   *  during version replacement where a stale-version chunk hasn't been
   *  deleted from the vector store yet — this filter is what actually
   *  guarantees two versions of the same document are never retrieved
   *  together, rather than relying on delete timing alone. */
  activeVersions: Map<string, number>;
}

function toScoredChunk(result: VectorSearchResult, score: number): ScoredChunk {
  const { text, ...metadata } = result.payload;
  return { chunk: { text, metadata }, score };
}

/**
 * query -> query embedding -> dense search (Qdrant) + sparse search (BM25)
 *       -> Reciprocal Rank Fusion -> (optional) reranking -> top-K final
 *
 * Dense and sparse results are candidates, not the answer — RRF fusion and
 * the final top-K cut both happen before anything reaches context building.
 */
export async function retrieve(
  query: string,
  topK: RetrievalTopK,
  deps: RetrievalDependencies,
): Promise<ScoredChunk[]> {
  const normalizedQuery = query.trim();

  const queryVector = await deps.embeddingProvider.embedQuery(normalizedQuery);
  const rawDenseResults = await deps.vectorStore.search(queryVector, topK.dense);
  const rawSparseResults = deps.bm25Index.search(normalizedQuery, topK.sparse);

  const strongSparseIds = new Set(rawSparseResults.filter((r) => r.score >= topK.minSparseScore).map((r) => r.id));
  const strongDenseIds = new Set(rawDenseResults.filter((r) => r.score >= topK.minDenseScore).map((r) => r.id));

  // Drop weak-everywhere noise before it ever reaches fusion — a hit only
  // survives if it was a STRONG match by at least one retrieval method,
  // not merely "present" in one list with a negligible score.
  const denseResults = rawDenseResults.filter((r) => strongDenseIds.has(r.id) || strongSparseIds.has(r.id));
  const sparseResults = rawSparseResults.filter((r) => strongSparseIds.has(r.id) || strongDenseIds.has(r.id));

  const denseById = new Map(denseResults.map((r) => [r.id, r]));
  const missingSparseIds = sparseResults.map((r) => r.id).filter((id) => !denseById.has(id));
  const hydrated = await deps.vectorStore.getByIds(missingSparseIds);
  const hydratedById = new Map(hydrated.map((r) => [r.id, r]));

  const fused = reciprocalRankFusion([
    { ids: denseResults.map((r) => r.id) },
    { ids: sparseResults.map((r) => r.id) },
  ]).slice(0, topK.fused);

  const candidates: ScoredChunk[] = [];
  for (const { id, score } of fused) {
    const result = denseById.get(id) ?? hydratedById.get(id);
    if (!result) continue;

    const scoredChunk = toScoredChunk(result, score);
    const { documentId, documentVersion } = scoredChunk.chunk.metadata;
    const activeVersion = deps.activeVersions.get(documentId);
    if (activeVersion !== undefined && documentVersion !== activeVersion) continue;

    candidates.push(scoredChunk);
  }

  const reranked = await deps.reranker.rerank(normalizedQuery, candidates);
  return reranked.slice(0, topK.final);
}
