import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedPdf } from '../../modules/rag/ingestion/pdf-parser';

// pdf-parse itself needs a real PDF binary to exercise meaningfully — that
// boundary is a thin wrapper (see pdf-parser.ts) around a well-maintained
// library. What this test actually needs to prove is the PIPELINE'S
// orchestration (duplicate detection, version replacement, atomic
// activation, BM25/vector-store consistency), so `parsePdf` is mocked to
// return a controlled, deterministic structure while every other stage
// (structure extraction, chunking, versioning, manifest) runs for real.
let mockParsedPdf: ParsedPdf;
vi.mock('../../modules/rag/ingestion/pdf-parser', async () => {
  const actual = await vi.importActual<typeof import('../../modules/rag/ingestion/pdf-parser')>(
    '../../modules/rag/ingestion/pdf-parser',
  );
  return { ...actual, parsePdf: vi.fn(() => Promise.resolve(mockParsedPdf)) };
});

import { runIngestionPipeline } from '../../modules/rag/ingestion/pipeline';
import { FileManifestStore } from '../../modules/rag/documents/manifest-store';
import { BM25Index } from '../../modules/rag/sparse/bm25-index';
import { FakeEmbeddingProvider, FakeVectorStore } from './fakes';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CHUNKER_CONFIG = { targetTokens: 200, maxTokens: 400, minTokens: 20 };

function pdf(text: string): ParsedPdf {
  return { pageCount: 1, pages: [{ pageNumber: 1, text, tables: [] }] };
}

describe('runIngestionPipeline', () => {
  const manifestPath = join(tmpdir(), `rag-pipeline-test-${Date.now()}.json`);
  let manifestStore: FileManifestStore;
  let vectorStore: FakeVectorStore;
  let embeddingProvider: FakeEmbeddingProvider;
  let bm25Index: BM25Index;

  beforeEach(async () => {
    await rm(manifestPath, { force: true });
    manifestStore = new FileManifestStore(manifestPath);
    vectorStore = new FakeVectorStore();
    embeddingProvider = new FakeEmbeddingProvider();
    bm25Index = new BM25Index();
  });

  function deps() {
    return { manifestStore, vectorStore, embeddingProvider, bm25Index, chunkerConfig: CHUNKER_CONFIG, maxDocumentSizeMb: 50 };
  }

  it('ingests a new document as version 1, active', async () => {
    mockParsedPdf = pdf('Mission\n\nScientia makes exam prep accessible to every student.');
    const { record } = await runIngestionPipeline(
      { filename: 'scientia-docs.pdf', buffer: Buffer.from('pdf-bytes-v1'), source: 'telegram:t1' },
      deps(),
    );

    expect(record.version).toBe(1);
    expect(record.status).toBe('active');
    expect(record.chunkCount).toBeGreaterThan(0);
    expect(vectorStore.size).toBe(record.chunkCount);
    expect(bm25Index.size).toBe(record.chunkCount);
  });

  it('skips reprocessing an identical re-upload (duplicate checksum)', async () => {
    mockParsedPdf = pdf('Mission\n\nScientia makes exam prep accessible to every student.');
    const buffer = Buffer.from('identical-bytes');

    const first = await runIngestionPipeline({ filename: 'scientia-docs.pdf', buffer, source: 'telegram:t1' }, deps());
    const sizeAfterFirst = vectorStore.size;

    const second = await runIngestionPipeline({ filename: 'scientia-docs.pdf', buffer, source: 'telegram:t1' }, deps());

    expect(second.record.version).toBe(first.record.version);
    expect(vectorStore.size).toBe(sizeAfterFirst); // nothing re-embedded/upserted
  });

  it('replaces the active version when the same filename is re-uploaded with different content', async () => {
    mockParsedPdf = pdf('Mission\n\nOriginal mission text.');
    const v1 = await runIngestionPipeline(
      { filename: 'scientia-docs.pdf', buffer: Buffer.from('v1-bytes'), source: 'telegram:t1' },
      deps(),
    );

    mockParsedPdf = pdf('Mission\n\nUpdated mission text with more detail than before.');
    const v2 = await runIngestionPipeline(
      { filename: 'scientia-docs.pdf', buffer: Buffer.from('v2-bytes'), source: 'telegram:t1' },
      deps(),
    );

    expect(v2.record.version).toBe(v1.record.version + 1);
    expect(v2.activeVersions.get(v2.record.documentId)).toBe(v2.record.version);

    // Old version's chunks must be gone from both indexes — never two
    // versions retrievable at once.
    for (const oldChunkId of v1.record.chunkIds) {
      expect(await vectorStore.getByIds([oldChunkId])).toEqual([]);
    }
    expect(bm25Index.size).toBe(v2.record.chunkCount);

    const manifest = await manifestStore.load();
    expect(manifest.find((r) => r.version === 1)?.status).toBe('superseded');
    expect(manifest.find((r) => r.version === 2)?.status).toBe('active');
  });

  it('rejects a document producing no extractable content', async () => {
    mockParsedPdf = { pageCount: 1, pages: [{ pageNumber: 1, text: '   ', tables: [] }] };
    await expect(
      runIngestionPipeline({ filename: 'empty.pdf', buffer: Buffer.from('x'), source: 'telegram:t1' }, deps()),
    ).rejects.toThrow();
  });

  it('rejects a document exceeding the configured size limit', async () => {
    mockParsedPdf = pdf('Some content.');
    const oversized = Buffer.alloc(2 * 1024 * 1024); // 2MB
    await expect(
      runIngestionPipeline(
        { filename: 'big.pdf', buffer: oversized, source: 'telegram:t1' },
        { ...deps(), maxDocumentSizeMb: 1 },
      ),
    ).rejects.toThrow(/exceeds the 1MB limit/);
  });
});
