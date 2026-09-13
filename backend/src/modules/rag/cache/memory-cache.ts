interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

// A public Helpdesk endpoint sees arbitrary free-text queries — most never
// repeat. TTL alone only reclaims an entry when something happens to `get()`
// that exact key again after it expires; a query asked once and never again
// would otherwise sit in memory forever. A hard cap with oldest-first
// eviction (Map iteration order == insertion order in JS) bounds memory
// regardless of query variety, independent of TTL.
const DEFAULT_MAX_ENTRIES = 1000;

/** A single generic in-memory TTL cache, with a bounded size. rag.service.ts
 *  instantiates one per namespace (query embedding / retrieval / answer)
 *  rather than this module hard-coding those three uses — keeps the cache
 *  mechanism reusable without being a speculative abstraction (all three
 *  real uses exist). */
export class TtlCache<V> {
  private store = new Map<string, CacheEntry<V>>();

  constructor(
    private readonly ttlSeconds: number,
    private readonly maxEntries: number = DEFAULT_MAX_ENTRIES,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    // Re-inserting moves a key to the end of Map's iteration order, so an
    // existing key being refreshed doesn't get treated as "oldest".
    this.store.delete(key);
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlSeconds * 1000 });
  }

  get size(): number {
    return this.store.size;
  }
}

/** Cache keys MUST include the active knowledge version — otherwise a new
 *  document version could serve an answer cached against the old one. */
export function versionedKey(knowledgeVersion: number, ...parts: string[]): string {
  return `v${knowledgeVersion}:${parts.join(':')}`;
}
