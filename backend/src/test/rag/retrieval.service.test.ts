import { describe, it, expect, beforeEach } from 'vitest';
import { retrieve } from '../../modules/rag/retrieval/retrieval.service';
import { NoOpReranker } from '../../modules/rag/retrieval/reranker';
import { BM25Index } from '../../modules/rag/sparse/bm25-index';
import { FakeEmbeddingProvider, FakeVectorStore } from './fakes';
import type { ChunkMetadata } from '../../modules/rag/core/types';

function metadata(overrides: Partial<ChunkMetadata>): ChunkMetadata {
  return {
    chunkId: 'chunk',
    documentId: 'doc-1',
    documentTitle: 'Scientia Documentation',
    documentVersion: 1,
    pageStart: 1,
    pageEnd: 1,
    section: 'General',
    subsection: null,
    contentType: 'paragraph',
    contentHash: 'hash',
    parserVersion: 'v1',
    chunkerVersion: 'v1',
    embeddingModel: 'fake-embedding-v1',
    ...overrides,
  };
}

const TOP_K = { dense: 5, sparse: 5, fused: 5, final: 3, minDenseScore: 0, minSparseScore: 0 };

describe('retrieve (hybrid dense + sparse + RRF)', () => {
  let vectorStore: FakeVectorStore;
  let embeddingProvider: FakeEmbeddingProvider;
  let bm25Index: BM25Index;

  beforeEach(async () => {
    vectorStore = new FakeVectorStore();
    embeddingProvider = new FakeEmbeddingProvider();
    bm25Index = new BM25Index();

    const chunks = [
      { id: 'pricing', text: 'The Pro plan costs 999 rupees per month and supports 500 students.' },
      { id: 'batches', text: 'Teachers can organize students into batches and assign tests to each batch.' },
      { id: 'qbank', text: 'The QBank contains a curated repository of practice questions by topic.' },
    ];

    for (const c of chunks) {
      const vector = await embeddingProvider.embedDocuments([c.text]);
      await vectorStore.upsertChunks([{ id: c.id, vector: vector[0], payload: { ...metadata({ chunkId: c.id }), text: c.text } }]);
      bm25Index.addDocument(c.id, c.text);
    }
  });

  function deps(activeVersions = new Map([['doc-1', 1]])) {
    return { embeddingProvider, vectorStore, bm25Index, reranker: new NoOpReranker(), activeVersions };
  }

  it('surfaces the semantically/lexically relevant chunk for a pricing question', async () => {
    const results = await retrieve('How much does the Pro plan cost?', TOP_K, deps());
    expect(results[0]?.chunk.metadata.chunkId).toBe('pricing');
  });

  it('finds an exact-terminology match (QBank) that a generic query implies', async () => {
    const results = await retrieve('What is the QBank?', TOP_K, deps());
    expect(results.map((r) => r.chunk.metadata.chunkId)).toContain('qbank');
  });

  it('filters out a chunk whose version is not the currently active one', async () => {
    // Simulate a stale chunk still physically present during a version-swap
    // window — activeVersions says v2 is active, but this chunk is v1.
    const staleVector = await embeddingProvider.embedDocuments(['Stale pricing content from an old version.']);
    await vectorStore.upsertChunks([{
      id: 'stale',
      vector: staleVector[0],
      payload: { ...metadata({ chunkId: 'stale', documentVersion: 1 }), text: 'Stale pricing content from an old version.' },
    }]);
    bm25Index.addDocument('stale', 'Stale pricing content from an old version.');

    const results = await retrieve('Stale pricing content', TOP_K, deps(new Map([['doc-1', 2]])));
    expect(results.map((r) => r.chunk.metadata.chunkId)).not.toContain('stale');
  });

  it('respects topK.final regardless of how many candidates were fused', async () => {
    const results = await retrieve('plan students batches questions', { ...TOP_K, final: 1 }, deps());
    expect(results).toHaveLength(1);
  });

  it('drops a weak dense-only match below minDenseScore instead of returning it as evidence', async () => {
    // A query sharing no real vocabulary with any indexed chunk still gets
    // *some* nonzero cosine score from the hashing fake (shared stopwords
    // collide into shared buckets) — minDenseScore exists precisely to
    // filter this kind of noise out rather than treat it as real evidence.
    const results = await retrieve('zzz qqq nonexistent gibberish', { ...TOP_K, minDenseScore: 0.9, minSparseScore: 0.9 }, deps());
    expect(results).toHaveLength(0);
  });
});
