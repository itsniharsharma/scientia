/** Provider-agnostic embedding boundary. Only the concrete provider under
 *  `providers/` knows about a specific vendor's API. */
export interface EmbeddingProvider {
  readonly model: string;
  readonly dimension: number;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}
