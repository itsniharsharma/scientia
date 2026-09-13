import type { ChunkMetadata } from '../core/types';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: ChunkMetadata & { text: string };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: ChunkMetadata & { text: string };
}

export interface VectorFilter {
  documentId?: string;
  documentVersion?: number;
}

/** Provider-agnostic vector store boundary. Only `providers/qdrant-store.ts`
 *  knows Qdrant-specific request/response shapes — nothing else in the
 *  codebase imports the Qdrant SDK directly. */
export interface VectorStore {
  createCollection(dimension: number): Promise<void>;
  upsertChunks(points: VectorPoint[]): Promise<void>;
  /** Deletes all chunks for a document, or only a specific version's chunks
   *  when `version` is given — needed during version replacement, where the
   *  new version's chunks must already be persisted under the same
   *  documentId before the old version's chunks are removed. */
  deleteDocument(documentId: string, version?: number): Promise<void>;
  search(vector: number[], topK: number, filter?: VectorFilter): Promise<VectorSearchResult[]>;
  /** Direct lookup by point id, no similarity search — used to hydrate full
   *  chunk payloads for candidates that came from sparse (BM25) retrieval
   *  rather than the dense search. */
  getByIds(ids: string[]): Promise<VectorSearchResult[]>;
  healthCheck(): Promise<boolean>;
}
