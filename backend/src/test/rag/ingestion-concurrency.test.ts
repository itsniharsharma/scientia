import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedPdf } from '../../modules/rag/ingestion/pdf-parser';

// Unlike the other pipeline tests (which share one `mockParsedPdf` variable —
// fine when calls are sequential), this file fires two ingestions
// CONCURRENTLY with different content, so parsePdf must derive its result
// from the actual input buffer instead of a single shared variable.
vi.mock('../../modules/rag/ingestion/pdf-parser', async () => {
  const actual = await vi.importActual<typeof import('../../modules/rag/ingestion/pdf-parser')>(
    '../../modules/rag/ingestion/pdf-parser',
  );
  return {
    ...actual,
    parsePdf: vi.fn(
      (buffer: Buffer): Promise<ParsedPdf> => Promise.resolve({
        pageCount: 1,
        pages: [{ pageNumber: 1, text: buffer.toString('utf-8'), tables: [] }],
      }),
    ),
  };
});

import { createRagService } from '../../modules/rag/rag.service';
import { FakeEmbeddingProvider, FakeVectorStore, FakeLLMProvider } from './fakes';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Telegraf's polling loop processes every update in a getUpdates batch
// CONCURRENTLY (`Promise.all(updates.map(handleUpdate))` — see
// node_modules/telegraf/lib/core/network/polling.js). Two documents with the
// same filename landing in the same batch — e.g. a teacher re-uploading a
// corrected file seconds after the first attempt — therefore call
// ingestDocument() concurrently for the SAME documentId. Without
// serialization, both read the manifest before either writes, both compute
// the same "next version number", and whichever manifest write loses the
// race leaves its own chunks orphaned in the vector store AND BM25 index —
// retrievable (they carry the same numeric documentVersion the manifest
// still calls active) despite not being listed in the active record's
// chunkIds. This is a real, silent grounding-integrity bug, not a
// theoretical one.
describe('RagService.ingestDocument concurrency (same filename, overlapping uploads)', () => {
  const manifestPath = join(tmpdir(), `rag-ingest-concurrency-test-${Date.now()}.json`);
  let vectorStore: FakeVectorStore;

  beforeEach(async () => {
    await rm(manifestPath, { force: true });
    vectorStore = new FakeVectorStore();
  });

  function buildService() {
    return createRagService({
      embeddingProvider: new FakeEmbeddingProvider(),
      vectorStore,
      llmProvider: new FakeLLMProvider(),
      manifestPath,
    });
  }

  it('serializes two concurrent uploads of the same filename instead of both computing the same version number', async () => {
    const service = buildService();

    const [recordA, recordB] = await Promise.all([
      service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('Mission\n\nFirst upload content.'), source: 'telegram:teacher-a' }),
      service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('Mission\n\nSecond upload, corrected content.'), source: 'telegram:teacher-b' }),
    ]);

    // Two genuinely different uploads must never be assigned the same
    // version number — that's what makes "the active version's chunkIds"
    // an unambiguous, complete description of what's retrievable.
    expect(recordA.version).not.toBe(recordB.version);

    const health = await service.healthCheck();
    // Exactly one document is active, and the vector store must contain
    // ONLY that active version's chunks — no orphaned chunks left behind
    // by whichever upload didn't "win" the manifest write.
    expect(health.activeDocuments).toBe(1);

    const laterRecord = recordA.version > recordB.version ? recordA : recordB;
    expect(vectorStore.size).toBe(laterRecord.chunkCount);
    expect(health.indexedChunks).toBe(laterRecord.chunkCount);
  });

  it('running the same two uploads sequentially (no race) produces the same correct outcome', async () => {
    const service = buildService();

    const recordA = await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('Mission\n\nFirst upload content.'), source: 'telegram:teacher-a' });
    const recordB = await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('Mission\n\nSecond upload, corrected content.'), source: 'telegram:teacher-b' });

    expect(recordB.version).toBe(recordA.version + 1);
    const health = await service.healthCheck();
    expect(health.activeDocuments).toBe(1);
    expect(vectorStore.size).toBe(recordB.chunkCount);
  });
});
