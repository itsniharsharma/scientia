import { describe, it, expect } from 'vitest';
import { formatCitations, hasInsufficientEvidence, filterSourcesByUsedChunks } from '../../modules/rag/citations/citation.service';
import type { ChunkMetadata, RetrievedContext, ScoredChunk, SourceRef } from '../../modules/rag/core/types';

describe('formatCitations', () => {
  it('formats a full source (document, section, subsection, page) per the spec example', () => {
    const source: SourceRef = { documentTitle: 'Scientia Documentation', section: 'Subscriptions', subsection: 'Pro Plan', page: 12 };
    expect(formatCitations([source])).toEqual(['Scientia Documentation — Subscriptions — Pro Plan — p. 12']);
  });

  it('omits a missing subsection rather than rendering it as null/empty', () => {
    const source: SourceRef = { documentTitle: 'Scientia Documentation', section: 'Policies', subsection: null, page: 19 };
    expect(formatCitations([source])).toEqual(['Scientia Documentation — Policies — p. 19']);
  });

  it('never fabricates a citation — output length always matches input length', () => {
    const sources: SourceRef[] = [];
    expect(formatCitations(sources)).toEqual([]);
  });
});

describe('hasInsufficientEvidence', () => {
  it('is true when retrieval found nothing', () => {
    const context: RetrievedContext = { chunks: [], sources: [], tokenCount: 0 };
    expect(hasInsufficientEvidence(context)).toBe(true);
  });

  it('is false when at least one chunk was retrieved', () => {
    const context = { chunks: [{}], sources: [], tokenCount: 10 } as unknown as RetrievedContext;
    expect(hasInsufficientEvidence(context)).toBe(false);
  });
});

function scoredChunk(overrides: Partial<ChunkMetadata> & { text?: string }): ScoredChunk {
  const { text = 'text', ...metadataOverrides } = overrides;
  const metadata: ChunkMetadata = {
    chunkId: 'c', documentId: 'd', documentTitle: 'Doc', documentVersion: 1,
    pageStart: 1, pageEnd: 1, section: 'Section', subsection: null, contentType: 'paragraph',
    contentHash: 'h', parserVersion: 'v1', chunkerVersion: 'v1', embeddingModel: 'm',
    ...metadataOverrides,
  };
  return { score: 1, chunk: { text, metadata } };
}

describe('filterSourcesByUsedChunks', () => {
  const context: RetrievedContext = {
    chunks: [
      scoredChunk({ section: 'Organisations', pageStart: 3, pageEnd: 3 }),
      scoredChunk({ section: 'What is Scientia', pageStart: 1, pageEnd: 1 }),
    ],
    sources: [
      { documentTitle: 'Doc', section: 'Organisations', subsection: null, page: 3 },
      { documentTitle: 'Doc', section: 'What is Scientia', subsection: null, page: 1 },
    ],
    tokenCount: 100,
  };

  it('falls back to every retrieved source when the model gave no parseable marker (null)', () => {
    expect(filterSourcesByUsedChunks(context, null)).toEqual(context.sources);
  });

  it('returns no sources when the model explicitly reported using none of the evidence', () => {
    expect(filterSourcesByUsedChunks(context, [])).toEqual([]);
  });

  it('narrows to only the sources the model reported actually using — no citation dumping', () => {
    expect(filterSourcesByUsedChunks(context, [1])).toEqual([context.sources[0]]);
  });

  it('preserves the order the model listed, and dedupes repeated indices', () => {
    expect(filterSourcesByUsedChunks(context, [2, 2, 1])).toEqual([context.sources[1], context.sources[0]]);
  });

  it('ignores an out-of-range (hallucinated) index rather than crashing', () => {
    expect(filterSourcesByUsedChunks(context, [99])).toEqual(context.sources); // nothing valid survived -> fallback
  });

  it('ignoring an out-of-range index still keeps the valid ones from the same list', () => {
    expect(filterSourcesByUsedChunks(context, [1, 99])).toEqual([context.sources[0]]);
  });

  it('dedupes two chunks that map to the same source', () => {
    const dupContext: RetrievedContext = {
      chunks: [
        scoredChunk({ section: 'Organisations', pageStart: 3, pageEnd: 3 }),
        scoredChunk({ section: 'Organisations', pageStart: 3, pageEnd: 3 }),
      ],
      sources: [{ documentTitle: 'Doc', section: 'Organisations', subsection: null, page: 3 }],
      tokenCount: 100,
    };
    expect(filterSourcesByUsedChunks(dupContext, [1, 2])).toEqual(dupContext.sources);
  });
});
