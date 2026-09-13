import { describe, it, expect } from 'vitest';
import { buildContext } from '../../modules/rag/context/context-builder';
import type { ScoredChunk, ChunkMetadata } from '../../modules/rag/core/types';

function scoredChunk(overrides: Partial<ChunkMetadata> & { text?: string }, score: number): ScoredChunk {
  const { text = 'Some chunk text.', ...metaOverrides } = overrides;
  const metadata: ChunkMetadata = {
    chunkId: 'chunk-1',
    documentId: 'doc-1',
    documentTitle: 'Scientia Documentation',
    documentVersion: 1,
    pageStart: 1,
    pageEnd: 1,
    section: 'Pricing',
    subsection: null,
    contentType: 'paragraph',
    contentHash: 'hash-1',
    parserVersion: 'v1',
    chunkerVersion: 'v1',
    embeddingModel: 'voyage-4-lite',
    ...metaOverrides,
  };
  return { chunk: { text, metadata }, score };
}

describe('buildContext', () => {
  it('preserves relevance order from retrieval', () => {
    const chunks = [
      scoredChunk({ chunkId: 'a', contentHash: 'a' }, 0.9),
      scoredChunk({ chunkId: 'b', contentHash: 'b' }, 0.5),
    ];
    const context = buildContext(chunks, 10_000);
    expect(context.chunks.map((c) => c.chunk.metadata.chunkId)).toEqual(['a', 'b']);
  });

  it('deduplicates chunks with an identical contentHash', () => {
    const chunks = [
      scoredChunk({ chunkId: 'a', contentHash: 'same-hash' }, 0.9),
      scoredChunk({ chunkId: 'b', contentHash: 'same-hash' }, 0.8),
    ];
    const context = buildContext(chunks, 10_000);
    expect(context.chunks).toHaveLength(1);
  });

  it('enforces the token budget — stops including chunks once the budget is exhausted', () => {
    const bigText = 'word '.repeat(1000); // ~1250 tokens
    const chunks = [
      scoredChunk({ chunkId: 'a', contentHash: 'a', text: bigText }, 0.9),
      scoredChunk({ chunkId: 'b', contentHash: 'b', text: bigText }, 0.8),
    ];
    const context = buildContext(chunks, 1500); // fits only the first
    expect(context.chunks).toHaveLength(1);
    expect(context.tokenCount).toBeLessThanOrEqual(1500);
  });

  it('builds a distinct source list, one entry per unique document/section/page', () => {
    const chunks = [
      scoredChunk({ chunkId: 'a', contentHash: 'a', section: 'Pricing', pageStart: 12 }, 0.9),
      scoredChunk({ chunkId: 'b', contentHash: 'b', section: 'Pricing', pageStart: 12 }, 0.8),
      scoredChunk({ chunkId: 'c', contentHash: 'c', section: 'Policies', pageStart: 19 }, 0.7),
    ];
    const context = buildContext(chunks, 10_000);
    expect(context.sources).toHaveLength(2);
  });

  it('returns zero chunks and zero sources for empty input', () => {
    const context = buildContext([], 10_000);
    expect(context.chunks).toEqual([]);
    expect(context.sources).toEqual([]);
    expect(context.tokenCount).toBe(0);
  });
});
