import { describe, it, expect, afterAll } from 'vitest';
import { QdrantVectorStore } from '../../modules/rag/vector/providers/qdrant-store';

// Gated behind real credentials, exactly like the organisation module's
// skipIfNoDb/skipIfNoTeacher pattern — runs against the actual configured
// Qdrant instance when available, skipped otherwise. This exists because
// two real bugs (invalid point-id format, missing payload index) only ever
// surfaced against the live service — FakeVectorStore correctly proves the
// application's OWN logic is right, but can't catch a wire-protocol
// mismatch with the real API.
const skipIfNoQdrant = !process.env.QDRANT_URL ? it.skip : it;

describe('QdrantVectorStore (live)', () => {
  const collection = process.env.QDRANT_COLLECTION || 'scientia_helpdesk';
  const dimension = Number.parseInt(process.env.RAG_EMBEDDING_DIMENSION || '1024', 10);
  const store = new QdrantVectorStore(process.env.QDRANT_URL!, process.env.QDRANT_API_KEY, collection);
  const testDocumentId = `live-test-doc-${Date.now()}`;

  afterAll(async () => {
    if (!process.env.QDRANT_URL) return;
    await store.deleteDocument(testDocumentId).catch(() => {});
  });

  skipIfNoQdrant('reports healthy against the real instance', async () => {
    expect(await store.healthCheck()).toBe(true);
  });

  skipIfNoQdrant('creates the collection and required payload indexes without error', async () => {
    await expect(store.createCollection(dimension)).resolves.toBeUndefined();
  });

  skipIfNoQdrant('round-trips a real point: upsert, search returns the true chunkId, then delete removes it', async () => {
    const chunkId = `live-test-chunk-${Date.now()}`;
    const vector = new Array(dimension).fill(0).map((_, i) => (i === 0 ? 1 : 0));

    await store.upsertChunks([{
      id: chunkId,
      vector,
      payload: {
        chunkId,
        documentId: testDocumentId,
        documentTitle: 'Live Test',
        documentVersion: 1,
        pageStart: 1,
        pageEnd: 1,
        section: 'Test',
        subsection: null,
        contentType: 'paragraph',
        contentHash: 'test',
        parserVersion: 'test',
        chunkerVersion: 'test',
        embeddingModel: 'test',
        text: 'Temporary live-test point.',
      },
    }]);

    // The returned id must be the real chunkId, not Qdrant's internal
    // UUID-shaped storage key — this is exactly the bug the point-id
    // translation in qdrant-store.ts fixes.
    const searchResults = await store.search(vector, 1, { documentId: testDocumentId });
    expect(searchResults[0]?.id).toBe(chunkId);

    const byId = await store.getByIds([chunkId]);
    expect(byId[0]?.id).toBe(chunkId);
    expect(byId[0]?.payload.text).toBe('Temporary live-test point.');

    await store.deleteDocument(testDocumentId);
    expect(await store.getByIds([chunkId])).toEqual([]);
  });

  skipIfNoQdrant('deleteDocument scoped to a specific version leaves other versions untouched', async () => {
    const chunkIdV1 = `live-test-v1-${Date.now()}`;
    const chunkIdV2 = `live-test-v2-${Date.now()}`;
    const vector = new Array(dimension).fill(0).map((_, i) => (i === 1 ? 1 : 0));
    const basePayload = {
      documentId: testDocumentId,
      documentTitle: 'Live Test',
      pageStart: 1,
      pageEnd: 1,
      section: 'Test',
      subsection: null,
      contentType: 'paragraph' as const,
      contentHash: 'test',
      parserVersion: 'test',
      chunkerVersion: 'test',
      embeddingModel: 'test',
    };

    await store.upsertChunks([
      { id: chunkIdV1, vector, payload: { ...basePayload, chunkId: chunkIdV1, documentVersion: 1, text: 'v1' } },
      { id: chunkIdV2, vector, payload: { ...basePayload, chunkId: chunkIdV2, documentVersion: 2, text: 'v2' } },
    ]);

    await store.deleteDocument(testDocumentId, 1);

    expect(await store.getByIds([chunkIdV1])).toEqual([]);
    const remaining = await store.getByIds([chunkIdV2]);
    expect(remaining).toHaveLength(1);

    await store.deleteDocument(testDocumentId); // full cleanup
  });
});
