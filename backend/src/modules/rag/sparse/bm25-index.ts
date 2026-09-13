// From-scratch BM25 — a short, well-understood algorithm that doesn't
// warrant a dependency. Provider-independent: this index only ever sees
// plain (id, text) pairs, never anything Qdrant- or embedding-specific.
// Handles exact terminology (product/feature/policy names, acronyms) that
// dense vector similarity can miss.

const K1 = 1.5;
const B = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

interface DocumentEntry {
  termFrequencies: Map<string, number>;
  length: number;
}

export interface BM25Result {
  id: string;
  score: number;
}

export class BM25Index {
  private documents = new Map<string, DocumentEntry>();
  private documentFrequency = new Map<string, number>();
  private totalLength = 0;

  addDocument(id: string, text: string): void {
    if (this.documents.has(id)) this.removeDocument(id);

    const tokens = tokenize(text);
    const termFrequencies = new Map<string, number>();
    for (const token of tokens) {
      termFrequencies.set(token, (termFrequencies.get(token) ?? 0) + 1);
    }

    for (const term of termFrequencies.keys()) {
      this.documentFrequency.set(term, (this.documentFrequency.get(term) ?? 0) + 1);
    }

    this.documents.set(id, { termFrequencies, length: tokens.length });
    this.totalLength += tokens.length;
  }

  removeDocument(id: string): void {
    const entry = this.documents.get(id);
    if (!entry) return;

    for (const term of entry.termFrequencies.keys()) {
      const count = this.documentFrequency.get(term) ?? 0;
      if (count <= 1) this.documentFrequency.delete(term);
      else this.documentFrequency.set(term, count - 1);
    }

    this.totalLength -= entry.length;
    this.documents.delete(id);
  }

  get size(): number {
    return this.documents.size;
  }

  search(query: string, topK: number): BM25Result[] {
    if (this.documents.size === 0) return [];

    const queryTerms = tokenize(query);
    const avgDocLength = this.totalLength / this.documents.size;
    const scores: BM25Result[] = [];

    for (const [id, entry] of this.documents) {
      let score = 0;
      for (const term of queryTerms) {
        const termFrequency = entry.termFrequencies.get(term);
        if (!termFrequency) continue;

        const docFrequency = this.documentFrequency.get(term) ?? 0;
        const idf = Math.log((this.documents.size - docFrequency + 0.5) / (docFrequency + 0.5) + 1);
        const numerator = termFrequency * (K1 + 1);
        const denominator = termFrequency + K1 * (1 - B + (B * entry.length) / avgDocLength);
        score += idf * (numerator / denominator);
      }
      if (score > 0) scores.push({ id, score });
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
