import { describe, it, expect, vi, beforeAll } from 'vitest';
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
import { runEvaluation } from '../../modules/rag/evaluation/evaluate';
import { FakeEmbeddingProvider, FakeVectorStore, FakeLLMProvider } from './fakes';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Helpdesk RAG evaluation (repeatable, deterministic fakes — no live API keys required)', () => {
  let result: Awaited<ReturnType<typeof runEvaluation>>;

  beforeAll(async () => {
    mockParsedPdf = {
      pageCount: FIXTURE_PAGES.length,
      pages: FIXTURE_PAGES.map((p, i) => ({ pageNumber: i + 1, text: p.text, tables: p.tables ?? [] })),
    };

    const service = createRagService({
      embeddingProvider: new FakeEmbeddingProvider(),
      vectorStore: new FakeVectorStore(),
      llmProvider: new FakeLLMProvider(),
      manifestPath: join(tmpdir(), `rag-eval-${Date.now()}.json`),
    });

    await service.ingestDocument({
      filename: 'scientia-documentation.pdf',
      buffer: Buffer.from('fixture'),
      source: 'evaluation-fixture',
    });

    result = await runEvaluation(service);

    // eslint-disable-next-line no-console
    console.log('\n─── Helpdesk RAG Evaluation ───', JSON.stringify(result, null, 2));
  });

  it('achieves reasonable Recall@K on the fixture-document questions', () => {
    expect(result.recallAtK).toBeGreaterThanOrEqual(0.7);
  });

  it('achieves reasonable MRR (relevant source ranks near the top)', () => {
    expect(result.mrr).toBeGreaterThanOrEqual(0.6);
  });

  it('never fabricates a citation — reported sources match the retrieved section at least as often as recall', () => {
    expect(result.citationCorrectness).toBe(result.recallAtK);
  });

  it('correctly distinguishes answerable from unanswerable questions', () => {
    expect(result.answerabilityAccuracy).toBeGreaterThanOrEqual(0.85);
  });

  it('covers every required question category', () => {
    const categories = Object.keys(result.perCategory);
    expect(categories).toEqual(
      expect.arrayContaining(['direct-fact', 'semantic', 'exact-terminology', 'policy', 'subscription-table', 'unanswerable']),
    );
  });
});
