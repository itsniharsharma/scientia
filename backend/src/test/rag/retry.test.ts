import { describe, it, expect, vi } from 'vitest';
import { withRetry, PermanentProviderError } from '../../modules/rag/core/retry';

describe('withRetry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('never retries a PermanentProviderError', async () => {
    const fn = vi.fn().mockRejectedValue(new PermanentProviderError('bad request'));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(PermanentProviderError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after maxAttempts transient failures', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
