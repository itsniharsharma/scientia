import { createHash } from 'node:crypto';
import { QdrantClient } from '@qdrant/js-client-rest';
import type { VectorStore, VectorPoint, VectorSearchResult, VectorFilter } from '../vector-store';
import { VectorStoreError } from '../../core/errors';
import type { ChunkMetadata } from '../../core/types';

/**
 * Qdrant point IDs must be an unsigned integer or a UUID-formatted string —
 * this codebase's chunk ids are SHA-256 content hashes, which are neither.
 * Rather than change what a chunk id looks like everywhere else (BM25
 * index, manifest, citations all use the real chunkId), this adapter
 * deterministically derives a UUID-shaped point id for Qdrant's storage key
 * only. The real chunkId always travels in the payload (already included
 * via ChunkMetadata) and is what every method here actually returns as
 * `id` — Qdrant's internal point id is never exposed outside this file.
 */
function toQdrantPointId(chunkId: string): string {
  const hex = createHash('md5').update(chunkId).digest('hex').split('');
  hex[12] = '4'; // UUID version 4
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4]; // UUID variant
  const h = hex.join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export class QdrantVectorStore implements VectorStore {
  private readonly client: QdrantClient;

  constructor(
    url: string,
    apiKey: string | undefined,
    private readonly collection: string,
  ) {
    this.client = new QdrantClient({ url, apiKey });
  }

  async createCollection(dimension: number): Promise<void> {
    try {
      const exists = await this.collectionExists();
      if (exists) {
        await this.assertDimensionMatches(dimension);
      } else {
        await this.client.createCollection(this.collection, {
          vectors: { size: dimension, distance: 'Cosine' },
        });
      }
      // Qdrant refuses to filter on a payload field with no index on it
      // (deleteDocument and any filtered search would 400) — this must
      // exist whether the collection was just created or already existed.
      // Idempotent: creating an index that already exists is a no-op.
      await this.client.createPayloadIndex(this.collection, { field_name: 'documentId', field_schema: 'keyword' });
      await this.client.createPayloadIndex(this.collection, { field_name: 'documentVersion', field_schema: 'integer' });
    } catch (err) {
      throw new VectorStoreError(`Failed to create/verify Qdrant collection "${this.collection}": ${message(err)}`);
    }
  }

  private async collectionExists(): Promise<boolean> {
    const { collections } = await this.client.getCollections();
    return collections.some((c) => c.name === this.collection);
  }

  /** The configured embedding dimension must match the Qdrant collection's
   *  actual vector size — a silent mismatch here would corrupt every future
   *  search. Fails loudly instead. */
  private async assertDimensionMatches(expectedDimension: number): Promise<void> {
    const info = await this.client.getCollection(this.collection);
    const vectors = info.config.params.vectors;
    const actualSize = typeof vectors === 'object' && vectors !== null && 'size' in vectors
      ? (vectors as { size: number }).size
      : undefined;

    if (actualSize !== undefined && actualSize !== expectedDimension) {
      throw new VectorStoreError(
        `Qdrant collection "${this.collection}" has dimension ${actualSize}, but RAG_EMBEDDING_DIMENSION is configured as ${expectedDimension}`,
      );
    }
  }

  async upsertChunks(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;
    try {
      await this.client.upsert(this.collection, {
        wait: true,
        points: points.map((p) => ({
          id: toQdrantPointId(p.id),
          vector: p.vector,
          payload: p.payload as unknown as Record<string, unknown>,
        })),
      });
    } catch (err) {
      throw new VectorStoreError(`Failed to upsert ${points.length} chunk(s) into Qdrant: ${message(err)}`);
    }
  }

  async deleteDocument(documentId: string, version?: number): Promise<void> {
    const must: Array<Record<string, unknown>> = [{ key: 'documentId', match: { value: documentId } }];
    if (version !== undefined) must.push({ key: 'documentVersion', match: { value: version } });

    try {
      await this.client.delete(this.collection, { wait: true, filter: { must } });
    } catch (err) {
      throw new VectorStoreError(`Failed to delete document "${documentId}" (version ${version ?? 'all'}) from Qdrant: ${message(err)}`);
    }
  }

  async search(vector: number[], topK: number, filter?: VectorFilter): Promise<VectorSearchResult[]> {
    try {
      const result = await this.client.query(this.collection, {
        query: vector,
        limit: topK,
        with_payload: true,
        filter: toQdrantFilter(filter),
      });

      return result.points.map((point) => {
        const payload = point.payload as unknown as ChunkMetadata & { text: string };
        return { id: payload.chunkId, score: point.score, payload };
      });
    } catch (err) {
      throw new VectorStoreError(`Qdrant search failed: ${message(err)}`);
    }
  }

  async getByIds(ids: string[]): Promise<VectorSearchResult[]> {
    if (ids.length === 0) return [];
    try {
      const records = await this.client.retrieve(this.collection, {
        ids: ids.map(toQdrantPointId),
        with_payload: true,
      });
      return records.map((record) => {
        const payload = record.payload as unknown as ChunkMetadata & { text: string };
        return { id: payload.chunkId, score: 0, payload };
      });
    } catch (err) {
      throw new VectorStoreError(`Qdrant retrieve-by-id failed: ${message(err)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }
}

function toQdrantFilter(filter?: VectorFilter) {
  if (!filter || (!filter.documentId && filter.documentVersion === undefined)) return undefined;
  const must = [];
  if (filter.documentId) must.push({ key: 'documentId', match: { value: filter.documentId } });
  if (filter.documentVersion !== undefined) must.push({ key: 'documentVersion', match: { value: filter.documentVersion } });
  return { must };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
