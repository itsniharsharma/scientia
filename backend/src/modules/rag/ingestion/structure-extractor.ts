import type { NormalizedDocument, Section, ContentBlock } from '../core/types';
import type { ParsedPdf, ParsedPage } from './pdf-parser';
import { normalizePageText } from './normalizer';
import { buildTableBlock } from './table-formatter';

// ─── Line classification heuristics ────────────────────────────────────────
// pdf-parse gives us plain text per page — no font size/weight information
// is exposed by its public API, so heading detection is pattern-based
// rather than layout-based. This is a documented, honest limitation (see
// README/final report), not a hidden one: headings are recognized as short,
// visually-isolated lines without terminal sentence punctuation; numbered
// prefixes ("1.", "2.3") additionally encode heading depth when present.

const BULLET_PREFIX = /^[-•*●‣]\s+/;
// The trailing [.)] is optional: "1. Title" and "1) Title" both carry an
// explicit marker before the space, but a numbered subsection heading like
// "1.1 Pro Plan" has nothing but whitespace after its last digit.
const NUMBERED_PREFIX = /^(\d+(?:\.\d+)*)[.)]?\s+(.*)$/;
const TERMINAL_PUNCTUATION = /[.!?,;]$/;

interface ClassifiedLine {
  raw: string;
  kind: 'blank' | 'heading' | 'list-item' | 'text';
  headingLevel?: number;
  listOrdered?: boolean;
  listText?: string;
}

function isAllCaps(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, '');
  return letters.length >= 3 && letters === letters.toUpperCase();
}

function looksLikeHeading(line: string, precededByBlank: boolean): number | null {
  const trimmed = line.trim();
  if (!precededByBlank) return null;
  if (trimmed.length < 2 || trimmed.length > 70) return null;
  if (BULLET_PREFIX.test(trimmed)) return null;

  const numbered = trimmed.match(NUMBERED_PREFIX);
  if (numbered) {
    // A numbered line is only a heading if its remainder is short and
    // title-like — a genuinely numbered LIST item usually contains a full
    // sentence. This is refined further by the list-run check below.
    const depth = numbered[1].split('.').length;
    return Math.min(depth, 3);
  }

  const endsCleanly = trimmed.endsWith(':') || !TERMINAL_PUNCTUATION.test(trimmed);
  if (!endsCleanly) return null;

  // Without numbering or font/layout information, there's no reliable
  // signal to distinguish an h1 from an h2 — so every un-numbered heading
  // defaults to level 1. Numbered prefixes ("1.1", "2.3.1") are the only
  // thing that encodes real nesting depth (see the numbered branch above).
  if (isAllCaps(trimmed)) return 1;

  const words = trimmed.split(/\s+/);
  const capitalizedRatio = words.filter((w) => /^[A-Z]/.test(w)).length / words.length;
  if (capitalizedRatio >= 0.6) return 1;

  return null;
}

function classifyLines(text: string): ClassifiedLine[] {
  const rawLines = text.split('\n');
  const classified: ClassifiedLine[] = [];

  // Tracks the last number confirmed to be part of an ordered-list run, so
  // the LAST item in a list (which has no "next" number to look ahead to)
  // is still recognized by matching forward from the item before it,
  // rather than only ever looking ahead.
  let lastListNumber: number | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      classified.push({ raw, kind: 'blank' });
      lastListNumber = null;
      continue;
    }

    const bullet = BULLET_PREFIX.test(trimmed);
    const numbered = trimmed.match(NUMBERED_PREFIX);
    const precededByBlank = i === 0 || rawLines[i - 1].trim().length === 0;

    if (bullet) {
      classified.push({ raw, kind: 'list-item', listOrdered: false, listText: trimmed.replace(BULLET_PREFIX, '') });
      lastListNumber = null;
      continue;
    }

    if (numbered) {
      const currentNum = Number.parseInt(numbered[1].split('.')[0], 10);
      const continuesRun = lastListNumber !== null && currentNum === lastListNumber + 1;
      const nextFewLines = rawLines.slice(i + 1, i + 4).map((l) => l.trim().match(NUMBERED_PREFIX));
      const startsNewRun = nextFewLines.some((m) => m && Number.parseInt(m[1].split('.')[0], 10) === currentNum + 1);

      if (continuesRun || startsNewRun) {
        classified.push({ raw, kind: 'list-item', listOrdered: true, listText: numbered[2] });
        lastListNumber = currentNum;
        continue;
      }
    }

    lastListNumber = null;
    const headingLevel = looksLikeHeading(trimmed, precededByBlank);
    if (headingLevel !== null) {
      classified.push({ raw, kind: 'heading', headingLevel });
      continue;
    }

    classified.push({ raw, kind: 'text' });
  }

  return classified;
}

// ─── Section tree assembly ──────────────────────────────────────────────────

function newSection(title: string, level: number, page: number): Section {
  return { title, level, page, blocks: [], subsections: [] };
}

/** Finds the section that a block/subsection at `level` should attach to. */
function findParent(root: Section, level: number): Section {
  let current = root;
  while (current.subsections.length > 0 && current.subsections[current.subsections.length - 1].level < level) {
    current = current.subsections[current.subsections.length - 1];
  }
  return current;
}

export function extractStructure(
  parsed: ParsedPdf,
  documentId: string,
  title: string,
): NormalizedDocument {
  const root = newSection(title, 0, 1);

  // A section can span multiple pages when a page break falls before the
  // next heading — the section open at the end of one page is exactly the
  // section content on the next page (with no heading of its own yet)
  // continues into, so it's threaded across the per-page calls rather than
  // reset to root at the start of every page.
  let currentSection = root;
  for (const page of parsed.pages) {
    currentSection = ingestPage(page, root, currentSection);
  }

  return { documentId, title, sections: root.subsections, pageCount: parsed.pageCount };
}

function ingestPage(page: ParsedPage, root: Section, initialSection: Section): Section {
  const normalizedText = normalizePageText(page.text);
  const lines = classifyLines(normalizedText);

  let pendingParagraph: string[] = [];
  let pendingList: { items: string[]; ordered: boolean } | null = null;
  let currentSection = initialSection;

  const flushParagraph = (target: Section) => {
    if (pendingParagraph.length > 0) {
      target.blocks.push({ type: 'paragraph', text: pendingParagraph.join(' ').trim(), page: page.pageNumber });
      pendingParagraph = [];
    }
  };
  const flushList = (target: Section) => {
    if (pendingList && pendingList.items.length > 0) {
      target.blocks.push({ type: 'list', items: pendingList.items, ordered: pendingList.ordered, page: page.pageNumber });
    }
    pendingList = null;
  };

  for (const line of lines) {
    if (line.kind === 'blank') {
      flushParagraph(currentSection);
      continue;
    }

    if (line.kind === 'heading') {
      flushParagraph(currentSection);
      flushList(currentSection);
      const level = line.headingLevel!;
      const parent = findParent(root, level);
      const headingTitle = line.raw.trim().replace(NUMBERED_PREFIX, '$2');
      const section = newSection(headingTitle, level, page.pageNumber);
      parent.subsections.push(section);
      currentSection = section;
      continue;
    }

    if (line.kind === 'list-item') {
      flushParagraph(currentSection);
      if (!pendingList) pendingList = { items: [], ordered: line.listOrdered ?? false };
      pendingList.items.push(line.listText ?? line.raw.trim());
      continue;
    }

    flushList(currentSection);
    pendingParagraph.push(line.raw.trim());
  }

  flushParagraph(currentSection);
  flushList(currentSection);

  // Tables are detected separately (via vector-graphics analysis in
  // pdf-parse), not from text lines — attach them to whichever section was
  // active by the end of the page's prose, which is the closest available
  // approximation of "the table belongs to this section" without precise
  // on-page coordinates for both text and tables.
  for (const rawTable of page.tables) {
    const block: ContentBlock | null = buildTableBlock(rawTable, page.pageNumber);
    if (block) currentSection.blocks.push(block);
  }

  return currentSection;
}
