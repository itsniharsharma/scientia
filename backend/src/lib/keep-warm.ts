import { logger } from '../shared/logger';

// Keeps the Render free-tier instance from hibernating.
//
// Render spins a free web service down after 15 minutes without inbound
// traffic, and the next visitor then waits ~55s (sometimes >2 min) for a cold
// start. External schedulers proved unable to prevent that: the GitHub Actions
// cron set to every 10 minutes actually fired every 4–9 hours. So the instance
// keeps itself awake: every few minutes it requests its own *public* URL. The
// request leaves the instance and comes back in through Render's edge, which
// counts as inbound traffic and resets the idle timer.
//
// This can only keep an instance awake, never wake a sleeping one — waking is
// the job of scripts/keep-warm.mjs (GitHub Actions) and of the website, which
// pings the backend directly from the visitor's browser on load.

const BASE_INTERVAL_MS = 5 * 60_000; // three chances inside Render's 15-min window
const JITTER_RATIO = 0.2;            // ±20% so pings never align with anything periodic
const RETRY_DELAYS_MS = [30_000, 60_000, 120_000];
const REQUEST_TIMEOUT_MS = 30_000;

export interface KeepWarmOptions {
  url: string;
  fetchImpl?: typeof fetch;
  random?: () => number;
}

export interface KeepWarmHandle {
  stop(): void;
}

export function nextDelayMs(consecutiveFailures: number, random: () => number): number {
  if (consecutiveFailures > 0) {
    return RETRY_DELAYS_MS[Math.min(consecutiveFailures, RETRY_DELAYS_MS.length) - 1];
  }
  const jitter = (random() * 2 - 1) * JITTER_RATIO;
  return Math.round(BASE_INTERVAL_MS * (1 + jitter));
}

// Resolves the public URL to ping, or null when self-pinging should not run.
// Render sets RENDER_EXTERNAL_URL on every web service; KEEP_WARM_URL overrides
// it and KEEP_WARM=off disables the loop entirely.
export function resolveKeepWarmUrl(env: NodeJS.ProcessEnv): string | null {
  if (env.KEEP_WARM === 'off') return null;
  const base = env.KEEP_WARM_URL ?? env.RENDER_EXTERNAL_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, '')}/health`;
}

export function startKeepWarm({ url, fetchImpl = fetch, random = Math.random }: KeepWarmOptions): KeepWarmHandle {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let failures = 0;

  async function ping(): Promise<void> {
    const started = Date.now();
    try {
      const res = await fetchImpl(url, {
        headers: { 'user-agent': 'scientia-keep-warm/1 (self)' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      // Drain the body so the socket is released back to the pool.
      await res.arrayBuffer().catch(() => undefined);

      // Any answer from the app proves the edge delivered the request, which
      // is what resets the idle timer. A 503 means the app is up but the DB is
      // not, which /health already reports on its own — still worth a warning.
      if (res.status >= 500 && res.status !== 503) throw new Error(`HTTP ${res.status}`);
      if (res.status === 503) {
        logger.warn('keep_warm.degraded', { status: res.status, latencyMs: Date.now() - started });
      }
      if (failures > 0) {
        logger.info('keep_warm.recovered', { afterFailures: failures, latencyMs: Date.now() - started });
      }
      failures = 0;
    } catch (err) {
      failures += 1;
      logger.warn('keep_warm.ping_failed', {
        consecutiveFailures: failures,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  function schedule(): void {
    if (stopped) return;
    timer = setTimeout(async () => {
      await ping();
      schedule();
    }, nextDelayMs(failures, random));
    // Never hold the process open — graceful shutdown must not wait on this.
    timer.unref?.();
  }

  logger.info('keep_warm.started', { url, intervalMs: BASE_INTERVAL_MS });
  schedule();

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
