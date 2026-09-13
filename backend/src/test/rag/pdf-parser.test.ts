import { describe, it, expect } from 'vitest';
import { parsePdf } from '../../modules/rag/ingestion/pdf-parser';
import { ParseError } from '../../modules/rag/core/errors';
import { MINIMAL_PDF_TEXT } from './fixtures/minimal.pdf';
import { TABLE_PDF_TEXT } from './fixtures/table.pdf';

// Uses the REAL pdf-parse library against real (if minimal) PDF binaries —
// deliberately not mocked here. Every other RAG test mocks parsePdf, which
// is correct for testing this codebase's own logic, but means a real
// integration bug in this thin wrapper around a real dependency would
// otherwise go completely unnoticed by the rest of the suite.
describe('parsePdf (real pdf-parse library, not mocked)', () => {
  it('extracts text from a real PDF buffer without throwing', async () => {
    const buffer = Buffer.from(MINIMAL_PDF_TEXT, 'utf-8');
    const result = await parsePdf(buffer);

    expect(result.pageCount).toBe(1);
    expect(result.pages[0].text).toContain('Hello Scientia');
    expect(result.pages[0].text).toContain('Second line of text');
  });

  it('rejects a buffer that is not a valid PDF', async () => {
    const buffer = Buffer.from('this is not a pdf file at all', 'utf-8');
    await expect(parsePdf(buffer)).rejects.toThrow(ParseError);
  });

  // Regression test for a real production failure: ingesting a PDF containing
  // vector graphics (rectangles/lines — anything that reaches getTable()'s
  // operator-list analysis, including real-world tables) threw "Cannot
  // transfer object of unsupported type" even though the input was already a
  // correctly-typed Uint8Array. Root cause: pdf-parse/pdfjs-dist transfers
  // (detaches) the input buffer to its worker on the underlying document's
  // first (lazy) load, and pdf-parser.ts called getText()+getTable()
  // concurrently via Promise.all — both raced to trigger that same first
  // load, and the loser received an already-detached buffer. A plain-text
  // fixture never exercises getTable()'s real analysis path, so it could not
  // catch this; this fixture has real `re`/`S`/`f` vector operators.
  it('extracts text AND tables from a real PDF containing vector graphics (regression: concurrent getText/getTable worker-transfer race)', async () => {
    // Mirrors the exact production byte path: Telegram's downloadTelegramFile()
    // returns Buffer.from(await response.arrayBuffer()).
    const arrayBuffer = new TextEncoder().encode(TABLE_PDF_TEXT).buffer;
    const buffer = Buffer.from(arrayBuffer);

    const result = await parsePdf(buffer);

    expect(result.pageCount).toBe(1);
    expect(result.pages[0].text).toContain('Plan');
    expect(result.pages[0].text).toContain('Free');
    expect(result.pages[0].tables.length).toBeGreaterThan(0);

    // The original bytes must remain untouched (checksum/versioning relies
    // on hashing this exact buffer before parsing).
    expect(buffer.length).toBe(arrayBuffer.byteLength);
    expect(buffer.subarray(0, 8).toString()).toBe('%PDF-1.4');
  });

  it('does not intermittently fail on repeated parses of the same table PDF (guards against the race reappearing)', async () => {
    for (let i = 0; i < 5; i++) {
      const buffer = Buffer.from(TABLE_PDF_TEXT, 'utf-8');
      const result = await parsePdf(buffer);
      expect(result.pages[0].tables.length).toBeGreaterThan(0);
    }
  });
});
