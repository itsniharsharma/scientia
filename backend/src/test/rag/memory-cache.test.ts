import { describe, it, expect, vi, afterEach } from 'vitest';
import { TtlCache, versionedKey } from '../../modules/rag/cache/memory-cache';

describe('TtlCache', () => {
  afterEach(() => vi.useRealTimers());

  it('returns a cached value before it expires', () => {
    const cache = new TtlCache<string>(60);
    cache.set('a', 'value');
    expect(cache.get('a')).toBe('value');
  });

  it('expires a value after its TTL and evicts it lazily on read', () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1); // 1 second TTL
    cache.set('a', 'value');
    expect(cache.get('a')).toBe('value');

    vi.advanceTimersByTime(1500);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0); // the expired entry was actually removed, not just hidden
  });

  it('never grows past maxEntries, evicting the oldest entry first', () => {
    const cache = new TtlCache<number>(60, 3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.size).toBe(3);

    cache.set('d', 4); // exceeds cap — oldest ('a') must be evicted

    expect(cache.size).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('never leaks unboundedly across many distinct never-repeated keys (the real-world Helpdesk pattern)', () => {
    const cache = new TtlCache<string>(60, 100);
    for (let i = 0; i < 10_000; i++) {
      cache.set(`unique-query-${i}`, 'answer');
    }
    expect(cache.size).toBeLessThanOrEqual(100);
  });

  it('refreshing an existing key does not make it the eviction target while newer keys exist', () => {
    const cache = new TtlCache<number>(60, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10); // refresh 'a' — 'b' is now the oldest
    cache.set('c', 3); // exceeds cap — 'b' should be evicted, not 'a'

    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });
});

describe('versionedKey', () => {
  it('includes the knowledge version so a new document version cannot serve a stale cache hit', () => {
    expect(versionedKey(1, 'answer', 'q')).not.toBe(versionedKey(2, 'answer', 'q'));
  });
});
