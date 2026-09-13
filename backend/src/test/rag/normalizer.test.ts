import { describe, it, expect } from 'vitest';
import { normalizePageText, stripRepeatedHeadersFooters } from '../../modules/rag/ingestion/normalizer';
import type { ParsedPage } from '../../modules/rag/ingestion/pdf-parser';

describe('normalizePageText', () => {
  it('rejoins a sentence broken mid-word across a hard line wrap', () => {
    const result = normalizePageText('The Pro plan supports up\nto 500 students.');
    expect(result).toBe('The Pro plan supports up to 500 students.');
  });

  it('collapses excessive blank lines but keeps paragraph breaks', () => {
    const result = normalizePageText('First paragraph.\n\n\n\n\nSecond paragraph.');
    expect(result).toBe('First paragraph.\n\nSecond paragraph.');
  });

  it('collapses repeated horizontal whitespace without touching newlines', () => {
    const result = normalizePageText('Price:    999\nStudents:   500');
    expect(result).toBe('Price: 999\nStudents: 500');
  });

  it('never removes numbers, currency, or punctuation that carries meaning', () => {
    const result = normalizePageText('The Pro plan costs $999.00 for up to 500 students — no hidden fees.');
    expect(result).toContain('$999.00');
    expect(result).toContain('500 students');
    expect(result).toContain('—');
  });
});

describe('stripRepeatedHeadersFooters', () => {
  function page(text: string, n: number): ParsedPage {
    return { pageNumber: n, text, tables: [] };
  }

  it('removes a line that repeats verbatim across most pages', () => {
    const pages = [
      page('Scientia Documentation v1\n\nMission content here.', 1),
      page('Scientia Documentation v1\n\nFeature content here.', 2),
      page('Scientia Documentation v1\n\nPricing content here.', 3),
    ];

    const result = stripRepeatedHeadersFooters(pages);
    for (const p of result) {
      expect(p.text).not.toContain('Scientia Documentation v1');
    }
    expect(result[0].text).toContain('Mission content here.');
  });

  it('leaves genuinely unique page content untouched', () => {
    const pages = [page('Alpha', 1), page('Beta', 2), page('Gamma', 3)];
    const result = stripRepeatedHeadersFooters(pages);
    expect(result.map((p) => p.text)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('does not strip a long repeated sentence (headers/footers are always short)', () => {
    const longLine = 'This is a substantial sentence that happens to repeat across every single page of the document for testing purposes.';
    const pages = [page(longLine, 1), page(longLine, 2), page(longLine, 3)];
    const result = stripRepeatedHeadersFooters(pages);
    expect(result[0].text).toBe(longLine);
  });
});
