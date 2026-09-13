import { describe, it, expect } from 'vitest';
import { BM25Index } from '../../modules/rag/sparse/bm25-index';

describe('BM25Index', () => {
  it('ranks a document containing the exact query term above one that does not', () => {
    const index = new BM25Index();
    index.addDocument('a', 'The Pro plan supports 500 students and advanced analytics.');
    index.addDocument('b', 'Scientia helps teachers create tests quickly.');

    const results = index.search('analytics', 10);
    expect(results[0]?.id).toBe('a');
  });

  it('finds an exact acronym/terminology match that dense similarity might miss', () => {
    const index = new BM25Index();
    index.addDocument('a', 'Refer to the QBank for the full question repository.');
    index.addDocument('b', 'Our platform offers a large library of practice questions.');

    const results = index.search('QBank', 10);
    expect(results[0]?.id).toBe('a');
  });

  it('returns no results for a query with no matching terms', () => {
    const index = new BM25Index();
    index.addDocument('a', 'Scientia pricing and plans.');
    expect(index.search('nonexistentword', 10)).toEqual([]);
  });

  it('removeDocument excludes a document from future searches', () => {
    const index = new BM25Index();
    index.addDocument('a', 'unique searchable term');
    index.removeDocument('a');
    expect(index.search('unique', 10)).toEqual([]);
    expect(index.size).toBe(0);
  });

  it('re-adding a document with the same id replaces rather than duplicates it', () => {
    const index = new BM25Index();
    index.addDocument('a', 'old content about pricing');
    index.addDocument('a', 'new content about features');
    expect(index.size).toBe(1);
    expect(index.search('pricing', 10)).toEqual([]);
    expect(index.search('features', 10)[0]?.id).toBe('a');
  });

  it('respects the topK limit', () => {
    const index = new BM25Index();
    for (let i = 0; i < 5; i++) index.addDocument(`doc-${i}`, 'shared term appears here');
    expect(index.search('shared', 2)).toHaveLength(2);
  });
});
