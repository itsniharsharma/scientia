import type { RetrievedContext, ScoredChunk, SourceRef } from '../core/types';
import { estimateTokens } from '../core/tokens';

// Exported so citation.service.ts's used-sources filter can derive/dedupe
// SourceRefs from a subset of chunks using the exact same identity rule —
// two call sites deriving "what counts as the same source" independently
// would be a correctness risk (they could disagree).
export function toSourceRef(chunk: ScoredChunk['chunk']): SourceRef {
  return {
    documentTitle: chunk.metadata.documentTitle,
    section: chunk.metadata.section,
    subsection: chunk.metadata.subsection,
    page: chunk.metadata.pageStart,
  };
}

export function sourceKey(source: SourceRef): string {
  return `${source.documentTitle}|${source.section}|${source.subsection}|${source.page}`;
}

/**
 * Retrieved chunks are candidates, not context — this builder deduplicates
 * exact repeats, keeps relevance order (retrieval already ranked them),
 * enforces a hard token budget so the LLM only ever receives what fits, and
 * derives a distinct source list for citations.
 */
export function buildContext(chunks: ScoredChunk[], maxContextTokens: number): RetrievedContext {
  const seenContentHashes = new Set<string>();
  const seenSources = new Set<string>();
  const included: ScoredChunk[] = [];
  const sources: SourceRef[] = [];
  let tokenCount = 0;

  for (const scored of chunks) {
    const { contentHash } = scored.chunk.metadata;
    if (seenContentHashes.has(contentHash)) continue;

    const chunkTokens = estimateTokens(scored.chunk.text);
    if (tokenCount + chunkTokens > maxContextTokens) continue;

    seenContentHashes.add(contentHash);
    included.push(scored);
    tokenCount += chunkTokens;

    const source = toSourceRef(scored.chunk);
    const key = sourceKey(source);
    if (!seenSources.has(key)) {
      seenSources.add(key);
      sources.push(source);
    }
  }

  return { chunks: included, sources, tokenCount };
}
