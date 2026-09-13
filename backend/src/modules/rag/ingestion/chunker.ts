import type {
  Chunk,
  ChunkContentType,
  ContentBlock,
  NormalizedDocument,
  Section,
} from '../core/types';
import { estimateTokens } from '../core/tokens';
import { sha256 } from '../core/hash';
import { formatTableAsText } from './table-formatter';
import { PARSER_VERSION } from './pdf-parser';

export const CHUNKER_VERSION = 'hierarchical-v1';

export interface ChunkerConfig {
  targetTokens: number;
  maxTokens: number;
  minTokens: number;
}

interface PendingBlock {
  text: string;
  page: number;
  contentType: ChunkContentType;
}

function blockToText(block: ContentBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text;
    case 'list':
      return block.items.map((item) => `${block.ordered ? '- ' : '• '}${item}`).join('\n');
    case 'table':
      return formatTableAsText(block);
  }
}

/** The two-level structural path a chunk inherits, per the spec's example
 *  ("Document: X / Section: Y / Subsection: Z"). Deeper nesting collapses
 *  its lowest two levels into section/subsection rather than growing an
 *  unbounded prefix. */
interface StructuralPath {
  section: string | null;
  subsection: string | null;
}

function buildContextPrefix(documentTitle: string, path: StructuralPath, topic?: string): string {
  const lines = [`Document: ${documentTitle}`];
  if (path.section) lines.push(`Section: ${path.section}`);
  if (path.subsection) lines.push(`Subsection: ${path.subsection}`);
  if (topic) lines.push(`Topic: ${topic}`);
  return lines.join('\n');
}

class ChunkAccumulator {
  private pending: PendingBlock[] = [];
  private tokenCount = 0;
  readonly chunks: Chunk[] = [];

  constructor(
    private readonly documentId: string,
    private readonly documentVersion: number,
    private readonly documentTitle: string,
    private readonly config: ChunkerConfig,
    private readonly embeddingModel: string | null,
  ) {}

  add(block: PendingBlock, path: StructuralPath): void {
    const blockTokens = estimateTokens(block.text);

    // A single block bigger than the max on its own (a very long paragraph)
    // is split at sentence boundaries as a fallback — it still never gets
    // split mid-sentence.
    if (blockTokens > this.config.maxTokens && block.contentType === 'paragraph') {
      this.flush(path);
      for (const piece of splitLongParagraph(block.text, this.config.maxTokens)) {
        this.pending.push({ ...block, text: piece });
        this.tokenCount = estimateTokens(piece);
        this.flush(path);
      }
      return;
    }

    if (this.tokenCount + blockTokens > this.config.maxTokens && this.pending.length > 0) {
      this.flush(path);
    }

    this.pending.push(block);
    this.tokenCount += blockTokens;

    if (this.tokenCount >= this.config.targetTokens) {
      this.flush(path);
    }
  }

  /** Section/subsection boundaries always flush — content from two
   *  different subsections is never merged into one chunk, even if that
   *  leaves a chunk under the target token size (structural boundaries
   *  outrank the token target, per the chunking priority order). */
  flush(path: StructuralPath): void {
    if (this.pending.length === 0) return;

    const text = this.pending.map((b) => b.text).join('\n\n');
    const pages = this.pending.map((b) => b.page);
    const contentTypes = new Set(this.pending.map((b) => b.contentType));
    const contentType: ChunkContentType = contentTypes.size === 1 ? [...contentTypes][0] : 'mixed';

    const prefix = buildContextPrefix(this.documentTitle, path);
    const fullText = `${prefix}\n\n${text}`;
    const contentHash = sha256(fullText);

    this.chunks.push({
      text: fullText,
      metadata: {
        chunkId: sha256(`${this.documentId}:${this.documentVersion}:${this.chunks.length}:${contentHash}`),
        documentId: this.documentId,
        documentTitle: this.documentTitle,
        documentVersion: this.documentVersion,
        pageStart: Math.min(...pages),
        pageEnd: Math.max(...pages),
        section: path.section,
        subsection: path.subsection,
        contentType,
        contentHash,
        parserVersion: PARSER_VERSION,
        chunkerVersion: CHUNKER_VERSION,
        embeddingModel: this.embeddingModel,
      },
    });

    this.pending = [];
    this.tokenCount = 0;
  }
}

/** Splits an overly long paragraph on sentence boundaries, greedily packing
 *  sentences up to maxTokens per piece. Never splits inside a sentence. */
function splitLongParagraph(text: string, maxTokens: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [text];
  const pieces: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current && estimateTokens(current + sentence) > maxTokens) {
      pieces.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

function walkSection(
  section: Section,
  ancestorPath: StructuralPath,
  acc: ChunkAccumulator,
): void {
  // The path a block directly inside THIS section inherits: this section
  // becomes either the "section" (if we're at depth 1) or "subsection"
  // (if nested further) — collapsing depth >2 into the same two slots.
  const path: StructuralPath = ancestorPath.section
    ? { section: ancestorPath.section, subsection: section.title }
    : { section: section.title, subsection: null };

  for (const block of section.blocks) {
    acc.add({ text: blockToText(block), page: block.page, contentType: block.type }, path);
  }
  // A section boundary always flushes — its own blocks are never merged
  // with a subsection's blocks into the same chunk.
  acc.flush(path);

  for (const subsection of section.subsections) {
    walkSection(subsection, path, acc);
  }
}

export function chunkDocument(
  doc: NormalizedDocument,
  documentVersion: number,
  config: ChunkerConfig,
  embeddingModel: string | null = null,
): Chunk[] {
  const acc = new ChunkAccumulator(doc.documentId, documentVersion, doc.title, config, embeddingModel);

  for (const section of doc.sections) {
    walkSection(section, { section: null, subsection: null }, acc);
  }

  return acc.chunks;
}
