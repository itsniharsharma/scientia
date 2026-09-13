import type { EmbeddingProvider } from '../embedding-provider';
import { EmbeddingError } from '../../core/errors';
import { withRetry, PermanentProviderError } from '../../core/retry';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const MAX_BATCH_SIZE = 100;

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  constructor(
    public readonly model: string,
    public readonly dimension: number,
    private readonly apiKey: string,
  ) {}

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
    }

    const results: number[][] = [];
    for (const batch of batches) {
      const embeddings = await this.embed(batch, 'document');
      results.push(...embeddings);
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [embedding] = await this.embed([text], 'query');
    return embedding;
  }

  private async embed(input: string[], inputType: 'document' | 'query'): Promise<number[][]> {
    return withRetry(async () => {
      const res = await fetch(VOYAGE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, model: this.model, input_type: inputType }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        // 429 (rate limit) and 5xx are transient; every other 4xx (bad
        // request, auth failure, ...) can never succeed by retrying.
        if (res.status !== 429 && res.status < 500) {
          throw new PermanentProviderError(`Voyage embedding request failed (${res.status}): ${body}`);
        }
        throw new Error(`Voyage embedding request failed (${res.status}): ${body}`);
      }

      const json = (await res.json()) as VoyageResponse;
      const embeddings = json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);

      for (const embedding of embeddings) {
        if (embedding.length !== this.dimension) {
          throw new PermanentProviderError(
            `Voyage returned ${embedding.length}-dim embeddings but RAG_EMBEDDING_DIMENSION is configured as ${this.dimension}`,
          );
        }
      }

      return embeddings;
    }).catch((err) => {
      if (err instanceof PermanentProviderError) throw new EmbeddingError(err.message);
      throw new EmbeddingError(`Voyage embedding failed after retries: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
