import type { EmbeddingProvider } from '../../modules/rag/embeddings/embedding-provider';
import type { VectorStore, VectorPoint, VectorSearchResult, VectorFilter } from '../../modules/rag/vector/vector-store';
import type { LLMProvider, GenerationInput } from '../../modules/rag/generation/llm-provider';
import type { ParsedGeneration } from '../../modules/rag/generation/prompts';

// 256 dims keeps hash collisions rare enough for word-overlap-based
// similarity to behave predictably in tests; this is test-only fixture
// code, not a claim about real embedding quality.
const FAKE_DIMENSION = 256;

/** Deterministic feature-hashing "embedding" — no ML model, but texts that
 *  share words get real, meaningful cosine similarity, which is enough to
 *  validate retrieval WIRING (does the pricing query actually surface the
 *  pricing chunk over the unrelated one) without needing a live API. */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly model = 'fake-embedding-v1';
  readonly dimension = FAKE_DIMENSION;
  public queryCallCount = 0;

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embed(t));
  }

  async embedQuery(text: string): Promise<number[]> {
    this.queryCallCount += 1;
    return this.embed(text);
  }

  private embed(text: string): number[] {
    const vector = new Array(this.dimension).fill(0);
    const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
      vector[hash % this.dimension] += 1;
    }
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/** In-memory VectorStore — real cosine search over stored points, real
 *  filtering, so this exercises the same logic paths as QdrantVectorStore
 *  without a network dependency. */
export class FakeVectorStore implements VectorStore {
  private points = new Map<string, VectorPoint>();

  async createCollection(): Promise<void> {}

  async upsertChunks(points: VectorPoint[]): Promise<void> {
    for (const point of points) this.points.set(point.id, point);
  }

  async deleteDocument(documentId: string, version?: number): Promise<void> {
    for (const [id, point] of this.points) {
      if (point.payload.documentId !== documentId) continue;
      if (version !== undefined && point.payload.documentVersion !== version) continue;
      this.points.delete(id);
    }
  }

  async search(vector: number[], topK: number, filter?: VectorFilter): Promise<VectorSearchResult[]> {
    return [...this.points.values()]
      .filter((p) => matchesFilter(p, filter))
      .map((p) => ({ id: p.id, score: cosineSimilarity(vector, p.vector), payload: p.payload }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async getByIds(ids: string[]): Promise<VectorSearchResult[]> {
    return ids
      .map((id) => this.points.get(id))
      .filter((p): p is VectorPoint => p !== undefined)
      .map((p) => ({ id: p.id, score: 0, payload: p.payload }));
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  get size(): number {
    return this.points.size;
  }
}

function matchesFilter(point: VectorPoint, filter?: VectorFilter): boolean {
  if (!filter) return true;
  if (filter.documentId && point.payload.documentId !== filter.documentId) return false;
  if (filter.documentVersion !== undefined && point.payload.documentVersion !== filter.documentVersion) return false;
  return true;
}

/** Records every prompt it was given and returns a canned, inspectable
 *  answer — no live LLM call. `usedIndices: null` mirrors "no citation
 *  marker parsed", which falls back to every retrieved source — the
 *  existing, already-tested behavior these fakes were built around. */
export class FakeLLMProvider implements LLMProvider {
  public calls: GenerationInput[] = [];

  async generate(input: GenerationInput): Promise<ParsedGeneration> {
    this.calls.push(input);
    return { answer: `Fake answer grounded in ${input.context.chunks.length} chunk(s).`, usedIndices: null };
  }
}
