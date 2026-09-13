import { describe, it, expect } from 'vitest';
import { chunkDocument } from '../../modules/rag/ingestion/chunker';
import { estimateTokens } from '../../modules/rag/core/tokens';
import type { NormalizedDocument, Section } from '../../modules/rag/core/types';

const CONFIG = { targetTokens: 50, maxTokens: 80, minTokens: 10 };

function doc(sections: Section[]): NormalizedDocument {
  return { documentId: 'doc-1', title: 'Scientia Documentation', sections, pageCount: 1 };
}

describe('chunkDocument', () => {
  it('inherits document/section/subsection context as a prefix on every chunk', () => {
    const chunks = chunkDocument(
      doc([{
        title: 'Subscriptions',
        level: 1,
        page: 1,
        blocks: [],
        subsections: [{
          title: 'Pro Plan',
          level: 2,
          page: 1,
          blocks: [{ type: 'paragraph', text: 'The Pro plan supports up to 500 students.', page: 1 }],
          subsections: [],
        }],
      }]),
      1,
      CONFIG,
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain('Document: Scientia Documentation');
    expect(chunks[0].text).toContain('Section: Subscriptions');
    expect(chunks[0].text).toContain('Subsection: Pro Plan');
    expect(chunks[0].metadata.section).toBe('Subscriptions');
    expect(chunks[0].metadata.subsection).toBe('Pro Plan');
  });

  it('never merges content from two different sections into one chunk', () => {
    const chunks = chunkDocument(
      doc([
        { title: 'Mission', level: 1, page: 1, blocks: [{ type: 'paragraph', text: 'Short mission text.', page: 1 }], subsections: [] },
        { title: 'Vision', level: 1, page: 1, blocks: [{ type: 'paragraph', text: 'Short vision text.', page: 1 }], subsections: [] },
      ]),
      1,
      CONFIG,
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0].metadata.section).toBe('Mission');
    expect(chunks[1].metadata.section).toBe('Vision');
  });

  it('never produces a chunk exceeding the configured max token bound', () => {
    const longParagraph = 'Scientia supports many features. '.repeat(40); // well over 80 tokens
    const chunks = chunkDocument(
      doc([{ title: 'Features', level: 1, page: 1, blocks: [{ type: 'paragraph', text: longParagraph, page: 1 }], subsections: [] }]),
      1,
      CONFIG,
    );

    for (const chunk of chunks) {
      expect(estimateTokens(chunk.text)).toBeLessThanOrEqual(CONFIG.maxTokens + 50); // + prefix overhead
    }
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('keeps a table block atomic — never splits it across chunks', () => {
    const chunks = chunkDocument(
      doc([{
        title: 'Pricing',
        level: 1,
        page: 1,
        blocks: [{ type: 'table', headers: ['Plan', 'Price'], rows: [['Free', '0'], ['Pro', '999']], page: 1 }],
        subsections: [],
      }]),
      1,
      CONFIG,
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].metadata.contentType).toBe('table');
    expect(chunks[0].text).toContain('Free:');
    expect(chunks[0].text).toContain('Pro:');
  });

  it('produces a deterministic contentHash for identical input', () => {
    const section: Section = { title: 'Mission', level: 1, page: 1, blocks: [{ type: 'paragraph', text: 'Same text.', page: 1 }], subsections: [] };
    const chunksA = chunkDocument(doc([section]), 1, CONFIG);
    const chunksB = chunkDocument(doc([{ ...section }]), 1, CONFIG);
    expect(chunksA[0].metadata.contentHash).toBe(chunksB[0].metadata.contentHash);
  });

  it('records accurate pageStart/pageEnd across a multi-page section', () => {
    const chunks = chunkDocument(
      doc([{
        title: 'Overview',
        level: 1,
        page: 1,
        blocks: [
          { type: 'paragraph', text: 'Page one content.', page: 1 },
          { type: 'paragraph', text: 'Page two content.', page: 2 },
        ],
        subsections: [],
      }]),
      1,
      CONFIG,
    );

    expect(chunks[0].metadata.pageStart).toBe(1);
    expect(chunks[0].metadata.pageEnd).toBe(2);
  });
});
