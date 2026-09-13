/** A permanent client error — retrying it can never succeed (bad request,
 *  auth failure, etc.). Transient errors (network, 429, 5xx) are retried;
 *  everything marked permanent is not. */
export class PermanentProviderError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PermanentProviderError';
  }
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

/** Exponential backoff retry. Never retries a `PermanentProviderError` —
 *  callers are expected to classify 4xx-that-isn't-429 as permanent before
 *  throwing, so a malformed request doesn't get retried three times
 *  identically. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof PermanentProviderError || attempt === maxAttempts) {
        throw err;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
