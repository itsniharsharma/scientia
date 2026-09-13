// ─── Normalized document representation ────────────────────────────────────
// Produced by ingestion/structure-extractor.ts. Preserves the document's
// heading hierarchy instead of flattening the PDF into one string.

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
  page: number;
}

export interface ListBlock {
  type: 'list';
  items: string[];
  ordered: boolean;
  page: number;
}

export interface TableBlock {
  type: 'table';
  /** Column headers, e.g. ["Plan", "Price", "Students"] */
  headers: string[];
  /** One array of cell values per row, aligned to `headers` */
  rows: string[][];
  page: number;
}

export type ContentBlock = ParagraphBlock | ListBlock | TableBlock;

export interface Section {
  /** Heading text, e.g. "Subscription Plans" */
  title: string;
  /** 1 = top-level section, 2 = subsection, etc. */
  level: number;
  page: number;
  blocks: ContentBlock[];
  subsections: Section[];
}

export interface NormalizedDocument {
  documentId: string;
  title: string;
  sections: Section[];
  pageCount: number;
}

// ─── Chunking ───────────────────────────────────────────────────────────────

export type ChunkContentType = 'paragraph' | 'list' | 'table' | 'mixed';

export interface ChunkMetadata {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentVersion: number;
  pageStart: number;
  pageEnd: number;
  section: string | null;
  subsection: string | null;
  contentType: ChunkContentType;
  contentHash: string;
  parserVersion: string;
  chunkerVersion: string;
  embeddingModel: string | null;
}

export interface Chunk {
  metadata: ChunkMetadata;
  /** The context-prefixed text that actually gets embedded and sent to the LLM. */
  text: string;
}

// ─── Retrieval ──────────────────────────────────────────────────────────────

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

export interface RetrievedContext {
  chunks: ScoredChunk[];
  sources: SourceRef[];
  tokenCount: number;
}

export interface SourceRef {
  documentTitle: string;
  section: string | null;
  subsection: string | null;
  page: number;
}

// ─── Generation ─────────────────────────────────────────────────────────────

/** A prior turn of the current chat session, supplied by the client so the
 *  (stateless, per-request) generation step can answer as a natural
 *  continuation instead of restarting the conversation. Never persisted
 *  server-side — it only ever lives for the duration of one request. */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationResult {
  answer: string;
  sources: SourceRef[];
  insufficientEvidence: boolean;
}

// ─── Documents / versioning ─────────────────────────────────────────────────

export type DocumentStatus = 'active' | 'superseded' | 'failed';

export interface DocumentRecord {
  documentId: string;
  filename: string;
  checksum: string;
  version: number;
  status: DocumentStatus;
  source: string;
  ingestedAt: string;
  parserVersion: string;
  chunkerVersion: string;
  embeddingModel: string;
  chunkCount: number;
  /** Needed to remove exactly this version's chunks from the in-memory BM25
   *  index when a newer version supersedes it (the dense vector store can
   *  be deleted by a documentId+version filter, but BM25Index has no such
   *  query capability — its removal is by exact id only). */
  chunkIds: string[];
}

/** A generic document input — the RAG engine never depends on Telegram. */
export interface DocumentInput {
  filename: string;
  buffer: Buffer;
  source: string;
}
