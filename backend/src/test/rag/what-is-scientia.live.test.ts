import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { ParsedPdf } from '../../modules/rag/ingestion/pdf-parser';
import { FIXTURE_PAGES } from '../../modules/rag/evaluation/fixture-document';

let mockParsedPdf: ParsedPdf;
vi.mock('../../modules/rag/ingestion/pdf-parser', async () => {
  const actual = await vi.importActual<typeof import('../../modules/rag/ingestion/pdf-parser')>(
    '../../modules/rag/ingestion/pdf-parser',
  );
  return { ...actual, parsePdf: vi.fn(() => Promise.resolve(mockParsedPdf)) };
});

import { createRagService } from '../../modules/rag/rag.service';
import { VoyageEmbeddingProvider } from '../../modules/rag/embeddings/providers/voyage-provider';
import { QdrantVectorStore } from '../../modules/rag/vector/providers/qdrant-store';
import { FakeLLMProvider } from './fakes';
import { getRagConfig } from '../../modules/rag/core/config';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Regression test for a real production report: "What is Scientia?" was
// answered with the insufficient-evidence fallback even though the
// knowledge base genuinely contained an overview of Scientia, while a
// differently-phrased follow-up ("...organisation scientia") correctly
// retrieved it. Investigating with the REAL Voyage + Qdrant + BM25 pipeline
// (not FakeEmbeddingProvider/FakeVectorStore — those only prove this
// codebase's own logic, not real embedding/retrieval behavior) showed
// retrieval already clears both the dense (0.3) and sparse (0.5) floors
// comfortably for "What is Scientia?" against the live knowledge base, so no
// threshold or retrieval-architecture change was made. This test pins that
// finding against a controlled, isolated fixture (not the live, mutable
// production collection) so a real regression in retrieval discrimination
// would be caught by CI whenever real credentials are available, without
// depending on the production Qdrant collection's contents.
const hasRealCredentials = Boolean(process.env.VOYAGE_API_KEY && process.env.QDRANT_URL);
const skipIfNoRealApis = hasRealCredentials ? it : it.skip;

describe('"What is Scientia?" retrieval (live Voyage + Qdrant + BM25, real embeddings — not mocked)', () => {
  const config = getRagConfig();
  const testCollection = `scientia_helpdesk_test_${Date.now()}`;
  const vectorStore = new QdrantVectorStore(process.env.QDRANT_URL ?? '', process.env.QDRANT_API_KEY, testCollection);
  const testDocumentId = 'scientia-documentation';

  afterAll(async () => {
    if (!hasRealCredentials) return;
    await vectorStore.deleteDocument(testDocumentId).catch(() => {});
  });

  // Ingested ONCE and shared by both queries below (rather than per-test)
  // to stay within Voyage's free-tier rate limit (3 requests/minute) —
  // embedDocuments() batches the whole fixture into a single call, and each
  // query below costs exactly one embedQuery() call.
  let service: ReturnType<typeof createRagService>;

  beforeAll(async () => {
    if (!hasRealCredentials) return;
    mockParsedPdf = {
      pageCount: FIXTURE_PAGES.length,
      pages: FIXTURE_PAGES.map((p, i) => ({ pageNumber: i + 1, text: p.text, tables: p.tables ?? [] })),
    };

    service = createRagService({
      embeddingProvider: new VoyageEmbeddingProvider(config.embedding.model, config.embedding.dimension, process.env.VOYAGE_API_KEY!),
      vectorStore,
      llmProvider: new FakeLLMProvider(),
      manifestPath: join(tmpdir(), `rag-what-is-scientia-${Date.now()}.json`),
    });

    await service.ingestDocument({
      filename: 'scientia-documentation.pdf',
      buffer: Buffer.from('fixture'),
      source: 'live-test',
    });
  }, 30000);

  skipIfNoRealApis('retrieves the Scientia overview for "What is Scientia?" (the exact previously-failing query)', async () => {
    const result = await service.queryKnowledge('What is Scientia?');

    expect(result.insufficientEvidence).toBe(false);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.some((s) => s.section === 'Mission and Vision')).toBe(true);
  }, 30000);

  skipIfNoRealApis('retrieves the same overview content for a differently-phrased follow-up, like the working query in the bug report', async () => {
    const result = await service.queryKnowledge('can u tell me something ab the organisation scientia');

    expect(result.insufficientEvidence).toBe(false);
    expect(result.sources.length).toBeGreaterThan(0);
  }, 30000);
});
