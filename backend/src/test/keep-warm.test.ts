import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startKeepWarm, nextDelayMs, resolveKeepWarmUrl } from '../lib/keep-warm';

const FIVE_MIN = 5 * 60_000;

function okResponse(status = 200): Response {
  return new Response('{}', { status });
}

describe('resolveKeepWarmUrl', () => {
  it('uses the URL Render injects', () => {
    expect(resolveKeepWarmUrl({ RENDER_EXTERNAL_URL: 'https://x.onrender.com' })).toBe(
      'https://x.onrender.com/health',
    );
  });

  it('prefers an explicit KEEP_WARM_URL and strips trailing slashes', () => {
    expect(
      resolveKeepWarmUrl({ RENDER_EXTERNAL_URL: 'https://a', KEEP_WARM_URL: 'https://b//' }),
    ).toBe('https://b/health');
  });

  it('is off outside Render and when disabled', () => {
    expect(resolveKeepWarmUrl({})).toBeNull();
    expect(resolveKeepWarmUrl({ RENDER_EXTERNAL_URL: 'https://a', KEEP_WARM: 'off' })).toBeNull();
  });
});

describe('nextDelayMs', () => {
  it('stays well inside Render’s 15-minute idle window, jitter included', () => {
    expect(nextDelayMs(0, () => 0)).toBe(FIVE_MIN * 0.8);
    expect(nextDelayMs(0, () => 0.999999)).toBeLessThanOrEqual(FIVE_MIN * 1.2);
    expect(FIVE_MIN * 1.2).toBeLessThan(15 * 60_000);
  });

  it('retries sooner after failures, with a capped backoff', () => {
    expect(nextDelayMs(1, Math.random)).toBe(30_000);
    expect(nextDelayMs(2, Math.random)).toBe(60_000);
    expect(nextDelayMs(3, Math.random)).toBe(120_000);
    expect(nextDelayMs(9, Math.random)).toBe(120_000);
  });
});

describe('startKeepWarm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('pings the public health URL on every interval', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => okResponse());
    const handle = startKeepWarm({ url: 'https://x/health', fetchImpl, random: () => 0.5 });

    expect(fetchImpl).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(FIVE_MIN);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://x/health');
    await vi.advanceTimersByTimeAsync(FIVE_MIN);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    handle.stop();
  });

  it('retries after 30s when a ping fails, then returns to the normal interval', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockImplementation(async () => okResponse());
    const handle = startKeepWarm({ url: 'https://x/health', fetchImpl, random: () => 0.5 });

    await vi.advanceTimersByTimeAsync(FIVE_MIN);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(FIVE_MIN - 1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    handle.stop();
  });

  it('treats a 5xx from the edge as a failure', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => okResponse(502));
    const handle = startKeepWarm({ url: 'https://x/health', fetchImpl, random: () => 0.5 });
    await vi.advanceTimersByTimeAsync(FIVE_MIN);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    handle.stop();
  });

  it('never pings again after stop()', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => okResponse());
    const handle = startKeepWarm({ url: 'https://x/health', fetchImpl, random: () => 0.5 });
    handle.stop();
    await vi.advanceTimersByTimeAsync(FIVE_MIN * 3);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
