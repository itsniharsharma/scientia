import { PDFParse } from 'pdf-parse';
import { ParseError } from '../core/errors';

export const PARSER_VERSION = 'pdf-parse-v2.1';

export interface ParsedPage {
  pageNumber: number;
  text: string;
  /** Tables detected on this page via pdf-parse's vector-graphics table
   *  detection. Each table is a 2D array of cell strings; row 0 is treated
   *  as the header row. */
  tables: string[][][];
}

export interface ParsedPdf {
  pageCount: number;
  pages: ParsedPage[];
}

/**
 * Thin wrapper around the `pdf-parse` library (already an installed
 * dependency, previously unused). Extracts per-page text AND per-page
 * tables (pdf-parse detects tables by analysing vector line/rectangle
 * drawing operators, not just text patterns) so downstream structure
 * extraction never has to work from a single flattened string.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  // pdf-parse/pdfjs-dist documents that a TypedArray passed as `data` is
  // TRANSFERRED (not copied) to its internal worker on first use, taking
  // ownership of the underlying ArrayBuffer. Copy into an independent
  // Uint8Array (not a zero-copy view over `buffer`'s own ArrayBuffer) so the
  // caller's original bytes are never at risk of detachment, regardless of
  // whether that Buffer happens to share a pooled ArrayBuffer with anything
  // else.
  const data = new Uint8Array(buffer);
  const parser = new PDFParse({ data });
  try {
    // IMPORTANT: these must run sequentially, not via Promise.all(). Both
    // calls trigger the SAME instance's lazy, one-time document load into
    // the worker, which transfers/detaches the input buffer. Firing them
    // concurrently races two transfer attempts against that same buffer —
    // the loser gets a buffer pdf-parse already detached and throws
    // "Cannot transfer object of unsupported type" (DataCloneError). This
    // reproduces 100% of the time with any PDF containing vector graphics
    // (rectangles/lines), which is why the earlier Buffer/Uint8Array-only
    // fix appeared to work against a plain-text fixture but failed on real
    // documents. Awaiting them in sequence lets the first call finish
    // loading the document (cached on the worker) before the second runs.
    const textResult = await parser.getText();
    const tableResult = await parser.getTable();

    if (textResult.total === 0) {
      throw new ParseError('PDF has no pages');
    }

    const tablesByPage = new Map<number, string[][][]>();
    for (const page of tableResult.pages) {
      tablesByPage.set(page.num, page.tables);
    }

    const pages: ParsedPage[] = textResult.pages.map((p) => ({
      pageNumber: p.num,
      text: p.text,
      tables: tablesByPage.get(p.num) ?? [],
    }));

    const hasAnyText = pages.some((p) => p.text.trim().length > 0);
    if (!hasAnyText) {
      throw new ParseError('PDF contains no extractable text (possibly a scanned/image-only PDF)');
    }

    return { pageCount: textResult.total, pages };
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError(`Failed to parse PDF: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await parser.destroy();
  }
}
