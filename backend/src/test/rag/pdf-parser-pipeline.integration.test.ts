import { describe, it, expect, beforeEach } from 'vitest';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runIngestionPipeline } from '../../modules/rag/ingestion/pipeline';
import { FileManifestStore } from '../../modules/rag/documents/manifest-store';
import { BM25Index } from '../../modules/rag/sparse/bm25-index';
import { FakeEmbeddingProvider, FakeVectorStore } from './fakes';
import { TABLE_PDF_TEXT } from './fixtures/table.pdf';

const CHUNKER_CONFIG = { targetTokens: 200, maxTokens: 400, minTokens: 20 };

// Unlike pipeline.integration.test.ts (which mocks parsePdf to isolate
// orchestration logic), this test deliberately runs the REAL pdf-parse
// library through the REAL end-to-end ingestion pipeline, using the same
// Buffer shape Telegram's downloadTelegramFile() produces. This is the
// regression test requested for the production failure where ingesting a
// PDF containing vector graphics threw "Cannot transfer object of
// unsupported type" from inside parsePdf's getText()/getTable() call.
describe('runIngestionPipeline with the real pdf-parse library (not mocked)', () => {
  const manifestPath = join(tmpdir(), `rag-real-pdf-pipeline-test-${Date.now()}.json`);
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

  it('ingests a real PDF containing vector graphics (table content) via the full pipeline, exercising the exact Telegram byte path', async () => {
    // Mirrors telegram.document.ts's downloadTelegramFile(): Buffer.from(await response.arrayBuffer()).
    const arrayBuffer = new TextEncoder().encode(TABLE_PDF_TEXT).buffer;
    const buffer = Buffer.from(arrayBuffer);

    const { record } = await runIngestionPipeline(
      { filename: 'Scientia_Helpdesk_Knowledge_Base.pdf', buffer, source: 'telegram:regression-test' },
      deps(),
    );

    expect(record.version).toBe(1);
    expect(record.status).toBe('active');
    expect(record.chunkCount).toBeGreaterThan(0);
    expect(vectorStore.size).toBe(record.chunkCount);
    expect(bm25Index.size).toBe(record.chunkCount);
  });
});
