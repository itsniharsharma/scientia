import { getRagConfig } from './core/config';
import { ConfigurationError } from './core/errors';
import { sha256 } from './core/hash';
import type { ConversationTurn, DocumentInput, DocumentRecord, GenerationResult } from './core/types';
import type { EmbeddingProvider } from './embeddings/embedding-provider';
import { VoyageEmbeddingProvider } from './embeddings/providers/voyage-provider';
import type { VectorStore } from './vector/vector-store';
import { QdrantVectorStore } from './vector/providers/qdrant-store';
import type { LLMProvider } from './generation/llm-provider';
import { GeminiProvider } from './generation/providers/gemini-provider';
import { BM25Index } from './sparse/bm25-index';
import { NoOpReranker, type RerankerProvider } from './retrieval/reranker';
import { retrieve } from './retrieval/retrieval.service';
import { buildContext } from './context/context-builder';
import { GROUNDING_SYSTEM_PROMPT } from './generation/prompts';
import { hasInsufficientEvidence, filterSourcesByUsedChunks } from './citations/citation.service';
import { TtlCache, versionedKey } from './cache/memory-cache';
import type { ManifestStore } from './documents/manifest-store';
import { FileManifestStore } from './documents/manifest-store';
import { runIngestionPipeline, buildActiveVersionsMap } from './ingestion/pipeline';
import { logger } from '../../shared/logger';
import { join } from 'node:path';

export interface RagService {
  ingestDocument(input: DocumentInput): Promise<DocumentRecord>;
  queryKnowledge(query: string, history?: ConversationTurn[]): Promise<GenerationResult>;
  healthCheck(): Promise<{ vectorStoreReachable: boolean; activeDocuments: number; indexedChunks: number }>;
}

export interface RagServiceOverrides {
  embeddingProvider?: EmbeddingProvider;
  vectorStore?: VectorStore;
  llmProvider?: LLMProvider;
  reranker?: RerankerProvider;
  manifestStore?: ManifestStore;
  manifestPath?: string;
}

// Max context budget: reserve headroom under the chunk max so the assembled
// context (several chunks) stays well within typical LLM input limits while
// still fitting several distinct sources for one answer.
const MAX_CONTEXT_TOKENS = 6000;

class RagServiceImpl implements RagService {
  private knowledgeVersion = 0;
  private activeVersions = new Map<string, number>();
  private readonly bm25Index = new BM25Index();
  private readonly embeddingCache: TtlCache<number[]>;
  private readonly retrievalCache: TtlCache<Awaited<ReturnType<typeof retrieve>>>;
  private readonly answerCache: TtlCache<GenerationResult>;
  private initialized = false;

  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly vectorStore: VectorStore,
    private readonly llmProvider: LLMProvider,
    private readonly reranker: RerankerProvider,
    private readonly manifestStore: ManifestStore,
    private readonly config: ReturnType<typeof getRagConfig>,
  ) {
    this.embeddingCache = new TtlCache(config.cache.ttlSeconds);
    this.retrievalCache = new TtlCache(config.cache.ttlSeconds);
    this.answerCache = new TtlCache(config.cache.ttlSeconds);
  }

  /** Rebuilds the in-memory BM25 index and active-version map from the
   *  persistent manifest + vector store on startup — the sparse index and
   *  version-consistency filter both start empty on a fresh process, so
   *  they must be reconstructed from persistent state, not just accumulated
   *  from whatever gets ingested in this process's lifetime. */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    const records = await this.manifestStore.load();
    this.activeVersions = buildActiveVersionsMap(records);

    const activeRecords = records.filter((r) => r.status === 'active');
    for (const record of activeRecords) {
      const chunks = await this.vectorStore.getByIds(record.chunkIds);
      for (const chunk of chunks) this.bm25Index.addDocument(chunk.id, chunk.payload.text);
    }

    this.initialized = true;
    logger.info('RAG_SERVICE_INITIALIZED', { activeDocuments: activeRecords.length, indexedChunks: this.bm25Index.size });
  }

  /**
   * Telegraf's polling loop processes every update in a getUpdates batch
   * CONCURRENTLY (`Promise.all(updates.map(handleUpdate))`), so two document
   * uploads arriving close together — e.g. a teacher re-uploading a
   * corrected file seconds after the first attempt — can call
   * ingestDocument() concurrently. Without serialization, both read the
   * manifest before either writes (racing on "what's the next version
   * number"), and FileManifestStore.save()'s atomic write uses a single
   * fixed `${filePath}.tmp` path, so two concurrent saves can also stomp on
   * each other's temp file and throw ENOENT on rename. Ingestion is rare and
   * human-paced (occasional PDF uploads, never a hot path), so a simple
   * global queue — not a more elaborate lock — is the right-sized fix: it
   * costs nothing in practice and removes both races entirely.
   */
  private ingestionQueue: Promise<unknown> = Promise.resolve();

  async ingestDocument(input: DocumentInput): Promise<DocumentRecord> {
    const run = this.ingestionQueue.then(
      () => this.ingestDocumentSerialized(input),
      () => this.ingestDocumentSerialized(input),
    );
    // What's stored for the NEXT caller to chain after must never itself
    // reject — otherwise one failed ingestion would permanently jam every
    // ingestion queued after it. The caller of THIS call still gets the
    // real outcome via `run`, unaffected by this swallow.
    this.ingestionQueue = run.catch(() => {});
    return run;
  }

  private async ingestDocumentSerialized(input: DocumentInput): Promise<DocumentRecord> {
    await this.ensureInitialized();

    const { record, activeVersions } = await runIngestionPipeline(input, {
      manifestStore: this.manifestStore,
      vectorStore: this.vectorStore,
      embeddingProvider: this.embeddingProvider,
      bm25Index: this.bm25Index,
      chunkerConfig: this.config.chunk,
      maxDocumentSizeMb: this.config.maxDocumentSizeMb,
    });

    this.activeVersions = activeVersions;
    this.knowledgeVersion += 1;
    return record;
  }

  async queryKnowledge(query: string, history: ConversationTurn[] = []): Promise<GenerationResult> {
    const startedAt = Date.now();
    await this.ensureInitialized();

    // A cached answer was phrased for a specific conversational context (or
    // none). Reusing it for a request carrying different prior turns could
    // serve a reply that ignores the current conversation, so caching only
    // applies to the common case of a fresh, standalone question.
    const cacheKey = history.length === 0 ? versionedKey(this.knowledgeVersion, 'answer', query) : null;
    const cachedAnswer = cacheKey ? this.answerCache.get(cacheKey) : undefined;
    if (cachedAnswer) {
      logger.info('RAG_QUERY_COMPLETE', { outcome: 'cache_hit', totalMs: Date.now() - startedAt });
      return cachedAnswer;
    }

    const retrievalStartedAt = Date.now();
    const scoredChunks = await this.retrieveWithCache(query);
    const retrievalMs = Date.now() - retrievalStartedAt;
    const context = buildContext(scoredChunks, MAX_CONTEXT_TOKENS);

    if (hasInsufficientEvidence(context)) {
      const result: GenerationResult = {
        answer: "Sorry, I don't have enough information about that in the current Scientia knowledge available to me.",
        sources: [],
        insufficientEvidence: true,
      };
      if (cacheKey) this.answerCache.set(cacheKey, result);
      logger.info('RAG_QUERY_COMPLETE', {
        outcome: 'insufficient_evidence',
        candidateCount: scoredChunks.length,
        retrievalMs,
        totalMs: Date.now() - startedAt,
      });
      return result;
    }

    const generationStartedAt = Date.now();
    const generation = await this.llmProvider.generate({
      systemInstructions: GROUNDING_SYSTEM_PROMPT,
      query,
      context,
      history,
    });
    const generationMs = Date.now() - generationStartedAt;

    const result: GenerationResult = {
      answer: generation.answer,
      // Narrowed to sources the answer actually drew from, not every chunk
      // that cleared retrieval's relevance floor — see citation.service.ts.
      sources: filterSourcesByUsedChunks(context, generation.usedIndices),
      insufficientEvidence: false,
    };
    if (cacheKey) this.answerCache.set(cacheKey, result);
    logger.info('RAG_QUERY_COMPLETE', {
      outcome: 'answered',
      candidateCount: scoredChunks.length,
      contextChunkCount: context.chunks.length,
      sourceCount: result.sources.length,
      retrievalMs,
      generationMs,
      totalMs: Date.now() - startedAt,
    });
    return result;
  }

  private async retrieveWithCache(query: string) {
    const cacheKey = versionedKey(this.knowledgeVersion, 'retrieval', query);
    const cached = this.retrievalCache.get(cacheKey);
    if (cached) return cached;

    const result = await retrieve(
      query,
      this.config.topK,
      {
        embeddingProvider: this.cachedEmbeddingProvider(),
        vectorStore: this.vectorStore,
        bm25Index: this.bm25Index,
        reranker: this.reranker,
        activeVersions: this.activeVersions,
      },
    );
    this.retrievalCache.set(cacheKey, result);
    return result;
  }

  /** Wraps embedQuery with the query-embedding cache — the underlying
   *  provider is unaware caching exists. */
  private cachedEmbeddingProvider(): EmbeddingProvider {
    const inner = this.embeddingProvider;
    const cache = this.embeddingCache;
    return {
      model: inner.model,
      dimension: inner.dimension,
      embedDocuments: (texts) => inner.embedDocuments(texts),
      embedQuery: async (text) => {
        const key = sha256(text);
        const cached = cache.get(key);
        if (cached) return cached;
        const embedding = await inner.embedQuery(text);
        cache.set(key, embedding);
        return embedding;
      },
    };
  }

  async healthCheck() {
    await this.ensureInitialized();
    const vectorStoreReachable = await this.vectorStore.healthCheck();
    const activeDocuments = this.activeVersions.size;
    return { vectorStoreReachable, activeDocuments, indexedChunks: this.bm25Index.size };
  }
}

let singleton: RagService | undefined;

/** Builds the service from real providers configured via env vars. Pass
 *  `overrides` to substitute fakes in tests — nothing else in the codebase
 *  should construct providers/adapters directly. */
export function createRagService(overrides: RagServiceOverrides = {}): RagService {
  const config = getRagConfig();

  const embeddingProvider =
    overrides.embeddingProvider ??
    (() => {
      if (!config.embedding.apiKey) throw new ConfigurationError('VOYAGE_API_KEY is not set');
      return new VoyageEmbeddingProvider(config.embedding.model, config.embedding.dimension, config.embedding.apiKey);
    })();

  const vectorStore =
    overrides.vectorStore ??
    (() => {
      if (!config.qdrant.url) throw new ConfigurationError('QDRANT_URL is not set');
      return new QdrantVectorStore(config.qdrant.url, config.qdrant.apiKey, config.qdrant.collection);
    })();

  const llmProvider =
    overrides.llmProvider ??
    (() => {
      if (!config.llm.apiKey) throw new ConfigurationError('GEMINI_API_KEY is not set');
      return new GeminiProvider(config.llm.model, config.llm.apiKey);
    })();

  const reranker = overrides.reranker ?? new NoOpReranker();
  const manifestStore =
    overrides.manifestStore ??
    new FileManifestStore(overrides.manifestPath ?? join(process.cwd(), 'data', 'rag', 'manifest.json'));

  return new RagServiceImpl(embeddingProvider, vectorStore, llmProvider, reranker, manifestStore, config);
}

/** Lazy singleton for the HTTP/Telegram layers — mirrors the existing
 *  lazy-singleton pattern already used for the Telegram bot
 *  (telegram.bot.ts::getBot), so importing this module never throws in
 *  environments (tests) where RAG env vars aren't configured. */
export function getRagService(): RagService {
  if (!singleton) singleton = createRagService();
  return singleton;
}
