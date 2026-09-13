import type { ParsedPage } from './pdf-parser';

/**
 * Whitespace/artifact cleanup on a single page's raw extracted text.
 * Deliberately conservative: only collapses formatting noise, never touches
 * numbers, currency, punctuation, URLs, or word content.
 */
export function normalizePageText(text: string): string {
  return text
    // PDF extraction sometimes breaks a sentence mid-word across a line
    // wrap with a hard line break and no hyphen — rejoin those onto one
    // line so heading/list heuristics see the intended sentence.
    .replace(/([a-z,])\n(?=[a-z])/g, '$1 ')
    // Collapse runs of 3+ blank lines down to a single paragraph break.
    .replace(/\n{3,}/g, '\n\n')
    // Collapse repeated horizontal whitespace (extraction sometimes emits
    // multiple spaces/tabs for what was one space), but never touch newlines.
    .replace(/[^\S\n]{2,}/g, ' ')
    .trim();
}

const MIN_REPEATS_FOR_HEADER_FOOTER = 3;

/**
 * Detects lines that repeat verbatim across many pages — the classic
 * signature of a running header/footer (e.g. "Scientia Documentation — v1"
 * on every page) — and strips them. A line must appear on at least
 * MIN_REPEATS_FOR_HEADER_FOOTER pages AND be short (headers/footers are
 * never full paragraphs) to be considered a candidate, so real repeated
 * short sentences in body content aren't accidentally removed.
 */
export function stripRepeatedHeadersFooters(pages: ParsedPage[]): ParsedPage[] {
  if (pages.length < MIN_REPEATS_FOR_HEADER_FOOTER) return pages;

  const lineCounts = new Map<string, number>();
  for (const page of pages) {
    const lines = new Set(page.text.split('\n').map((l) => l.trim()).filter(Boolean));
    for (const line of lines) {
      if (line.length === 0 || line.length > 80) continue;
      lineCounts.set(line, (lineCounts.get(line) ?? 0) + 1);
    }
  }

  const boilerplate = new Set(
    [...lineCounts.entries()]
      .filter(([, count]) => count >= MIN_REPEATS_FOR_HEADER_FOOTER)
      .map(([line]) => line),
  );
  if (boilerplate.size === 0) return pages;

  return pages.map((page) => ({
    ...page,
    text: page.text
      .split('\n')
      .filter((line) => !boilerplate.has(line.trim()))
      .join('\n'),
  }));
}
