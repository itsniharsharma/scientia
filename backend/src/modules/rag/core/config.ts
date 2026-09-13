import { ConfigurationError } from './errors';

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new ConfigurationError(`${name} must be an integer, got "${raw}"`);
  }
  return parsed;
}

function bool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === 'true';
}

function float(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (Number.isNaN(parsed)) {
    throw new ConfigurationError(`${name} must be a number, got "${raw}"`);
  }
  return parsed;
}

export interface RagConfig {
  embedding: {
    provider: 'voyage';
    model: string;
    dimension: number;
    apiKey: string | undefined;
  };
  llm: {
    provider: 'gemini';
    model: string;
    apiKey: string | undefined;
  };
  qdrant: {
    url: string | undefined;
    apiKey: string | undefined;
    collection: string;
  };
  topK: {
    dense: number;
    sparse: number;
    fused: number;
    final: number;
    /** See RetrievalTopK.minDenseScore/minSparseScore
     *  (retrieval/retrieval.service.ts) for the full rationale — this is
     *  where their configured values come from. */
    minDenseScore: number;
    minSparseScore: number;
  };
  chunk: {
    targetTokens: number;
    maxTokens: number;
    minTokens: number;
  };
  cache: {
    enabled: boolean;
    ttlSeconds: number;
  };
  maxDocumentSizeMb: number;
}

// Read lazily (not at module-load time) so importing this module never
// throws in environments (tests) where RAG env vars aren't set — only
// actually calling a provider that needs a given key does.
export function getRagConfig(): RagConfig {
  return {
    embedding: {
      provider: 'voyage',
      model: process.env.RAG_EMBEDDING_MODEL || 'voyage-4-lite',
      dimension: int('RAG_EMBEDDING_DIMENSION', 1024),
      apiKey: process.env.VOYAGE_API_KEY,
    },
    llm: {
      provider: 'gemini',
      model: process.env.RAG_LLM_MODEL || 'gemini-3.6-flash',
      apiKey: process.env.GEMINI_API_KEY,
    },
    qdrant: {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collection: process.env.QDRANT_COLLECTION || 'scientia_helpdesk',
    },
    topK: {
      dense: int('RAG_TOP_K_DENSE', 20),
      sparse: int('RAG_TOP_K_SPARSE', 20),
      fused: int('RAG_TOP_K_FUSED', 20),
      final: int('RAG_TOP_K_FINAL', 5),
      minDenseScore: float('RAG_MIN_DENSE_SCORE', 0.3),
      minSparseScore: float('RAG_MIN_SPARSE_SCORE', 0.5),
    },
    chunk: {
      targetTokens: int('RAG_CHUNK_TARGET_TOKENS', 600),
      maxTokens: int('RAG_CHUNK_MAX_TOKENS', 900),
      minTokens: int('RAG_CHUNK_MIN_TOKENS', 100),
    },
    cache: {
      enabled: bool('RAG_CACHE_ENABLED', true),
      ttlSeconds: int('RAG_CACHE_TTL_SECONDS', 3600),
    },
    maxDocumentSizeMb: int('RAG_MAX_DOCUMENT_SIZE_MB', 50),
  };
}
