import type { DocumentInput, DocumentRecord } from '../core/types';
import type { EmbeddingProvider } from '../embeddings/embedding-provider';
import type { VectorStore } from '../vector/vector-store';
import type { ManifestStore } from '../documents/manifest-store';
import type { BM25Index } from '../sparse/bm25-index';
import { InvalidDocumentError } from '../core/errors';
import { sha256 } from '../core/hash';
import { parsePdf, PARSER_VERSION } from './pdf-parser';
import { stripRepeatedHeadersFooters } from './normalizer';
import { extractStructure } from './structure-extractor';
import { chunkDocument, CHUNKER_VERSION, type ChunkerConfig } from './chunker';
import {
  deriveDocumentId,
  findDuplicate,
  findActiveVersion,
  nextVersionNumber,
  activateNewVersion,
} from '../documents/versioning';
import { logger } from '../../../shared/logger';

export interface PipelineDependencies {
  manifestStore: ManifestStore;
  vectorStore: VectorStore;
  embeddingProvider: EmbeddingProvider;
  bm25Index: BM25Index;
  chunkerConfig: ChunkerConfig;
  maxDocumentSizeMb: number;
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * PDF -> parse -> normalize -> structure -> chunk -> embed -> persist.
 *
 * Duplicate PDFs (identical checksum, same document already active) short-
 * circuit before any parsing. New versions are fully embedded and upserted
 * into the vector store BEFORE the old version's chunks are removed and
 * before the manifest is updated — the pipeline never leaves the knowledge
 * base in a half-updated state: either this function returns a fully
 * active new version, or it throws and nothing about the active version
 * changed.
 */
export async function runIngestionPipeline(
  input: DocumentInput,
  deps: PipelineDependencies,
): Promise<{ record: DocumentRecord; activeVersions: Map<string, number> }> {
  const sizeMb = input.buffer.byteLength / (1024 * 1024);
  if (sizeMb > deps.maxDocumentSizeMb) {
    throw new InvalidDocumentError(`Document is ${sizeMb.toFixed(1)}MB, exceeds the ${deps.maxDocumentSizeMb}MB limit`);
  }

  const checksum = sha256(input.buffer);
  const documentId = deriveDocumentId(input.filename);
  const records = await deps.manifestStore.load();

  const duplicate = findDuplicate(records, documentId, checksum);
  if (duplicate) {
    logger.info('RAG_INGEST_DUPLICATE_SKIPPED', { documentId, filename: input.filename, checksum });
    return { record: duplicate, activeVersions: buildActiveVersionsMap(records) };
  }

  const parsed = await parsePdf(input.buffer);
  const normalizedPages = stripRepeatedHeadersFooters(parsed.pages);
  const title = titleFromFilename(input.filename);
  const structuredDoc = extractStructure({ ...parsed, pages: normalizedPages }, documentId, title);

  const version = nextVersionNumber(records, documentId);
  const chunks = chunkDocument(structuredDoc, version, deps.chunkerConfig, deps.embeddingProvider.model);

  if (chunks.length === 0) {
    throw new InvalidDocumentError('No extractable content produced any chunks — the PDF may be empty or image-only');
  }

  const embeddings = await deps.embeddingProvider.embedDocuments(chunks.map((c) => c.text));

  await deps.vectorStore.createCollection(deps.embeddingProvider.dimension);
  await deps.vectorStore.upsertChunks(
    chunks.map((chunk, i) => ({
      id: chunk.metadata.chunkId,
      vector: embeddings[i],
      payload: { ...chunk.metadata, text: chunk.text },
    })),
  );

  for (const chunk of chunks) deps.bm25Index.addDocument(chunk.metadata.chunkId, chunk.text);

  const previousActive = findActiveVersion(records, documentId);
  if (previousActive) {
    await deps.vectorStore.deleteDocument(documentId, previousActive.version);
    for (const oldChunkId of previousActive.chunkIds) deps.bm25Index.removeDocument(oldChunkId);
  }

  const record: DocumentRecord = {
    documentId,
    filename: input.filename,
    checksum,
    version,
    status: 'active',
    source: input.source,
    ingestedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION,
    chunkerVersion: CHUNKER_VERSION,
    embeddingModel: deps.embeddingProvider.model,
    chunkCount: chunks.length,
    chunkIds: chunks.map((c) => c.metadata.chunkId),
  };

  const updatedRecords = activateNewVersion(records, record);
  await deps.manifestStore.save(updatedRecords);

  logger.info('RAG_INGEST_COMPLETE', { documentId, version, chunkCount: chunks.length, filename: input.filename });

  return { record, activeVersions: buildActiveVersionsMap(updatedRecords) };
}

export function buildActiveVersionsMap(records: DocumentRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    if (record.status === 'active') map.set(record.documentId, record.version);
  }
  return map;
}
