import { describe, it, expect } from 'vitest';
import { extractStructure } from '../../modules/rag/ingestion/structure-extractor';
import type { ParsedPdf } from '../../modules/rag/ingestion/pdf-parser';

function pdf(pages: Array<{ text: string; tables?: string[][][] }>): ParsedPdf {
  return {
    pageCount: pages.length,
    pages: pages.map((p, i) => ({ pageNumber: i + 1, text: p.text, tables: p.tables ?? [] })),
  };
}

describe('extractStructure', () => {
  it('creates a top-level section from a heading and attaches following paragraphs', () => {
    const doc = extractStructure(
      pdf([{ text: 'Mission\n\nScientia exists to make examination prep accessible to every student.' }]),
      'doc-1',
      'Scientia Documentation',
    );

    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].title).toBe('Mission');
    expect(doc.sections[0].blocks).toHaveLength(1);
    expect(doc.sections[0].blocks[0]).toMatchObject({ type: 'paragraph' });
  });

  it('nests a numbered subsection heading under its parent section', () => {
    const doc = extractStructure(
      pdf([{
        text:
          'Subscriptions\n\nWe offer multiple plans.\n\n' +
          '1.1 Pro Plan\n\nThe Pro plan supports up to 500 students.',
      }]),
      'doc-1',
      'Scientia Documentation',
    );

    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].title).toBe('Subscriptions');
    expect(doc.sections[0].subsections).toHaveLength(1);
    expect(doc.sections[0].subsections[0].title).toBe('Pro Plan');
  });

  it('groups consecutive bullet lines into one ordered-false list block', () => {
    const doc = extractStructure(
      pdf([{
        text:
          'Features\n\n' +
          '- Test generation\n' +
          '- Batch management\n' +
          '- Telegram integration',
      }]),
      'doc-1',
      'Scientia Documentation',
    );

    const listBlock = doc.sections[0].blocks.find((b) => b.type === 'list');
    expect(listBlock).toBeDefined();
    if (listBlock?.type === 'list') {
      expect(listBlock.ordered).toBe(false);
      expect(listBlock.items).toEqual(['Test generation', 'Batch management', 'Telegram integration']);
    }
  });

  it('treats a sequential numbered run as a list, not headings', () => {
    const doc = extractStructure(
      pdf([{
        text:
          'Getting Started\n\n' +
          '1. Register an account\n' +
          '2. Verify your email\n' +
          '3. Create your first test',
      }]),
      'doc-1',
      'Scientia Documentation',
    );

    expect(doc.sections[0].subsections).toHaveLength(0);
    const listBlock = doc.sections[0].blocks.find((b) => b.type === 'list');
    expect(listBlock).toBeDefined();
    if (listBlock?.type === 'list') {
      expect(listBlock.ordered).toBe(true);
      expect(listBlock.items).toHaveLength(3);
    }
  });

  it('attaches a detected table to the active section as a table block', () => {
    const doc = extractStructure(
      pdf([{
        text: 'Subscription Plans\n\nSee pricing below.',
        tables: [[['Plan', 'Price', 'Students'], ['Free', '0', '50'], ['Pro', '999', '500']]],
      }]),
      'doc-1',
      'Scientia Documentation',
    );

    const tableBlock = doc.sections[0].blocks.find((b) => b.type === 'table');
    expect(tableBlock).toBeDefined();
    if (tableBlock?.type === 'table') {
      expect(tableBlock.headers).toEqual(['Plan', 'Price', 'Students']);
      expect(tableBlock.rows).toHaveLength(2);
    }
  });

  it('preserves page numbers across a multi-page document', () => {
    const doc = extractStructure(
      pdf([{ text: 'Overview\n\nPage one content.' }, { text: 'More content on page two.' }]),
      'doc-1',
      'Scientia Documentation',
    );

    expect(doc.pageCount).toBe(2);
    const blocks = doc.sections[0].blocks;
    expect(blocks.some((b) => b.page === 1)).toBe(true);
    expect(blocks.some((b) => b.page === 2)).toBe(true);
  });
});
