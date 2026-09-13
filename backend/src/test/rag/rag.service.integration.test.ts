import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedPdf } from '../../modules/rag/ingestion/pdf-parser';

let mockParsedPdf: ParsedPdf;
vi.mock('../../modules/rag/ingestion/pdf-parser', async () => {
  const actual = await vi.importActual<typeof import('../../modules/rag/ingestion/pdf-parser')>(
    '../../modules/rag/ingestion/pdf-parser',
  );
  return { ...actual, parsePdf: vi.fn(() => Promise.resolve(mockParsedPdf)) };
});

import { createRagService } from '../../modules/rag/rag.service';
import { FileManifestStore } from '../../modules/rag/documents/manifest-store';
import { FakeEmbeddingProvider, FakeVectorStore, FakeLLMProvider } from './fakes';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function pdf(text: string): ParsedPdf {
  return { pageCount: 1, pages: [{ pageNumber: 1, text, tables: [] }] };
}

describe('RagService (end-to-end with fakes: no live Qdrant/Voyage/Gemini)', () => {
  const manifestPath = join(tmpdir(), `rag-service-test-${Date.now()}.json`);
  let embeddingProvider: FakeEmbeddingProvider;
  let llmProvider: FakeLLMProvider;

  beforeEach(async () => {
    await rm(manifestPath, { force: true });
    embeddingProvider = new FakeEmbeddingProvider();
    llmProvider = new FakeLLMProvider();
  });

  function buildService() {
    return createRagService({
      embeddingProvider,
      vectorStore: new FakeVectorStore(),
      llmProvider,
      manifestPath,
    });
  }

  it('answers a question using retrieved context and returns matching citations', async () => {
    const service = buildService();
    mockParsedPdf = pdf(
      'Subscriptions\n\n1.1 Pro Plan\n\nThe Pro plan costs 999 rupees per month and supports up to 500 students.',
    );
    await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('bytes'), source: 'telegram:t1' });

    const result = await service.queryKnowledge('How much does the Pro plan cost?');

    expect(result.insufficientEvidence).toBe(false);
    expect(result.answer).toContain('Fake answer grounded in');
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources[0].documentTitle).toBe('Scientia Docs');
  });

  it('returns an insufficient-evidence answer without calling the LLM when nothing is retrieved', async () => {
    const service = buildService();
    const result = await service.queryKnowledge('Anything at all, no documents ingested yet');

    expect(result.insufficientEvidence).toBe(true);
    expect(result.sources).toEqual([]);
    expect(llmProvider.calls).toHaveLength(0);
  });

  it('caches the query embedding — an identical query is not re-embedded', async () => {
    const service = buildService();
    mockParsedPdf = pdf('Mission\n\nScientia makes exam prep accessible to every student.');
    await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('bytes'), source: 'telegram:t1' });

    await service.queryKnowledge('What is the mission?');
    const callsAfterFirst = embeddingProvider.queryCallCount;
    await service.queryKnowledge('What is the mission?');

    expect(embeddingProvider.queryCallCount).toBe(callsAfterFirst); // second call served from cache
  });

  it('passes conversation history through to the LLM provider for continuity', async () => {
    const service = buildService();
    mockParsedPdf = pdf(
      'Subscriptions\n\n1.1 Pro Plan\n\nThe Pro plan costs 999 rupees per month and supports up to 500 students.',
    );
    await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('bytes'), source: 'telegram:t1' });

    const history = [
      { role: 'user' as const, content: 'What is Scientia?' },
      { role: 'assistant' as const, content: 'Scientia is an exam-prep platform.' },
    ];
    await service.queryKnowledge('How much does the Pro plan cost?', history);

    expect(llmProvider.calls).toHaveLength(1);
    expect(llmProvider.calls[0].history).toEqual(history);
  });

  it('does not serve a cached answer from a standalone question to a request carrying conversation history', async () => {
    const service = buildService();
    mockParsedPdf = pdf(
      'Subscriptions\n\n1.1 Pro Plan\n\nThe Pro plan costs 999 rupees per month and supports up to 500 students.',
    );
    await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('bytes'), source: 'telegram:t1' });

    await service.queryKnowledge('How much does the Pro plan cost?');
    expect(llmProvider.calls).toHaveLength(1);

    await service.queryKnowledge('How much does the Pro plan cost?', [{ role: 'user', content: 'hi' }]);
    expect(llmProvider.calls).toHaveLength(2); // not served from the standalone-question cache entry
  });

  it('healthCheck reports the vector store and indexed chunk count', async () => {
    const service = buildService();
    mockParsedPdf = pdf('Mission\n\nScientia makes exam prep accessible to every student.');
    await service.ingestDocument({ filename: 'scientia-docs.pdf', buffer: Buffer.from('bytes'), source: 'telegram:t1' });

    const health = await service.healthCheck();
    expect(health.vectorStoreReachable).toBe(true);
    expect(health.activeDocuments).toBe(1);
    expect(health.indexedChunks).toBeGreaterThan(0);
  });
});
