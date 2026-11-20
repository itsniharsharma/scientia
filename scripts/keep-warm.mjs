#!/usr/bin/env node
// Wakes the Scientia backend on Render and confirms it is healthy.
//
//   node scripts/keep-warm.mjs                      # wake once, exit 0 when healthy
//   node scripts/keep-warm.mjs --watch 5            # keep it warm, ping every ~5 min
//   node scripts/keep-warm.mjs --proxy-url ""       # skip the Vercel proxy check
//
// The backend keeps itself awake once it is up (backend/src/lib/keep-warm.ts).
// This script is the watchdog that wakes it when it is not — after a deploy
// that never got traffic, a platform restart, or anything else that slipped
// past the self-ping. It runs from GitHub Actions and works from any machine
// with Node 18+; it has no dependencies.
//
// What a probe can see, and what the script does about it:
//   healthy      200 from the app                  → done
//   degraded     503 JSON from the app (DB down)   → app is awake; retry briefly, then fail
//   hibernating  429 `x-render-routing: hibernate-rate-limited`
//                                                  → Render throttles wake-ups per source IP;
//                                                    back off and try again
//   waking       timeout, reset, or a 5xx without the app's JSON
//                                                  → cold start in progress; keep waiting
//   broken       anything else (404, 401, …)       → misconfiguration; fail at once
//
// Exit codes: 0 healthy, 1 not healthy before the deadline, 2 bad arguments.

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULTS = {
  backendUrl: 'https://scientia-bx5h.onrender.com',
  proxyUrl: 'https://scientia-website.vercel.app/api',
  deadlineSeconds: 420,
  attemptTimeoutSeconds: 150,
};

// A first answer slower than this means the backend was asleep.
const COLD_START_THRESHOLD_MS = 15_000;

// ── Probe ────────────────────────────────────────────────────────────────────

export function classify({ status, headers, body, error }) {
  // No answer at all — a cold start holds the connection open until the app
  // boots. The overall deadline bounds how long that is tolerated.
  if (error) return 'waking';
  const routing = (headers?.get?.('x-render-routing') ?? '').toLowerCase();
  if (status === 429 && routing.includes('hibernate')) return 'hibernating';
  if (status >= 200 && status < 300) return 'healthy';
  const fromApp = looksLikeAppJson(body);
  if (status === 503 && fromApp) return 'degraded';
  if (status === 429 && !fromApp) return 'hibernating';
  if (status >= 500) return 'waking';
  return 'broken';
}

function looksLikeAppJson(body) {
  if (typeof body !== 'string') return false;
  try {
    const parsed = JSON.parse(body);
    return typeof parsed === 'object' && parsed !== null && ('status' in parsed || 'error' in parsed);
  } catch {
    return false;
  }
}

export async function probe(url, { timeoutMs, fetchImpl = fetch }) {
  const started = Date.now();
  try {
    const res = await fetchImpl(url, {
      headers: { 'user-agent': 'scientia-keep-warm/1 (watchdog)', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await res.text().catch(() => '');
    const state = classify({ status: res.status, headers: res.headers, body });
    return {
      state,
      status: res.status,
      ms: Date.now() - started,
      retryAfterMs: parseRetryAfter(res.headers.get('retry-after')),
      detail: summarizeBody(body),
    };
  } catch (error) {
    return { state: classify({ error }), status: null, ms: Date.now() - started, detail: error.message };
  }
}

function parseRetryAfter(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

function summarizeBody(body) {
  try {
    const parsed = JSON.parse(body);
    if (parsed?.services?.database) {
      return `db=${parsed.services.database.status}${parsed.services.database.latencyMs != null ? ` (${parsed.services.database.latencyMs}ms)` : ''}`;
    }
  } catch {
    /* not JSON */
  }
  return body.slice(0, 80).replace(/\s+/g, ' ');
}

// Exponential backoff with full jitter, capped. `attempt` starts at 1.
export function backoffMs(attempt, random = Math.random, { baseMs = 5_000, capMs = 60_000 } = {}) {
  const ceiling = Math.min(capMs, baseMs * 2 ** (attempt - 1));
  return Math.round(ceiling / 2 + random() * (ceiling / 2));
}

// ── Wake loop ────────────────────────────────────────────────────────────────

const MAX_DEGRADED_RETRIES = 3;

export async function wake(url, {
  deadlineMs,
  attemptTimeoutMs,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  now = Date.now,
  random = Math.random,
  log = () => {},
}) {
  const startedAt = now();
  const attempts = [];
  let degraded = 0;

  for (let attempt = 1; ; attempt++) {
    const remaining = deadlineMs - (now() - startedAt);
    const result = await probe(url, { timeoutMs: Math.max(1_000, Math.min(attemptTimeoutMs, remaining)), fetchImpl });
    attempts.push(result);
    log(`attempt ${attempt}: ${result.state}${result.status ? ` HTTP ${result.status}` : ''} in ${result.ms}ms — ${result.detail}`);

    if (result.state === 'healthy') {
      return { ok: true, attempts, totalMs: now() - startedAt, wasCold: wasCold(attempts) };
    }
    if (result.state === 'broken') break;
    if (result.state === 'degraded' && ++degraded > MAX_DEGRADED_RETRIES) break;

    const wait = Math.max(result.retryAfterMs ?? 0, backoffMs(attempt, random));
    if (now() - startedAt + wait >= deadlineMs) break;
    await sleep(wait);
  }
  return { ok: false, attempts, totalMs: now() - startedAt, wasCold: wasCold(attempts) };
}

function wasCold(attempts) {
  const first = attempts[0];
  return !!first && (first.state !== 'healthy' || first.ms > COLD_START_THRESHOLD_MS);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const opts = { ...DEFAULTS, watchMinutes: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    const take = () => {
      if (value === undefined) throw new Error(`${flag} needs a value`);
      i++;
      return value;
    };
    switch (flag) {
      case '--url': opts.backendUrl = take(); break;
      case '--proxy-url': opts.proxyUrl = take(); break;
      case '--deadline': opts.deadlineSeconds = positive(flag, take()); break;
      case '--attempt-timeout': opts.attemptTimeoutSeconds = positive(flag, take()); break;
      case '--watch': opts.watchMinutes = positive(flag, take()); break;
      default: throw new Error(`unknown argument: ${flag}`);
    }
  }
  return opts;
}

function positive(flag, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${flag} must be a positive number`);
  return n;
}

const inActions = !!process.env.GITHUB_ACTIONS;

function annotate(level, message) {
  if (inActions) console.log(`::${level}::${message}`);
  else console.log(`${level.toUpperCase()}: ${message}`);
}

function stamp(message) {
  console.log(`${new Date().toISOString()} ${message}`);
}

function writeSummary(lines) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, lines.join('\n') + '\n');
}

async function runOnce(opts) {
  const backendHealth = `${opts.backendUrl.replace(/\/+$/, '')}/health`;
  stamp(`waking ${backendHealth}`);
  const backend = await wake(backendHealth, {
    deadlineMs: opts.deadlineSeconds * 1000,
    attemptTimeoutMs: opts.attemptTimeoutSeconds * 1000,
    log: stamp,
  });

  // The path real users take: Vercel rewrites /api/* to the backend. Only
  // meaningful once the backend itself is up.
  let proxy = null;
  if (backend.ok && opts.proxyUrl) {
    const proxyHealth = `${opts.proxyUrl.replace(/\/+$/, '')}/health`;
    stamp(`checking user-facing path ${proxyHealth}`);
    proxy = await wake(proxyHealth, { deadlineMs: 60_000, attemptTimeoutMs: 30_000, log: stamp });
  }

  const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
  if (!backend.ok) {
    const last = backend.attempts.at(-1);
    annotate('error', `Backend not healthy after ${seconds(backend.totalMs)} (${backend.attempts.length} attempts, last: ${last?.state}).`);
  } else if (backend.wasCold) {
    annotate('warning', `Backend was asleep and took ${seconds(backend.totalMs)} to wake. Its self-ping is not holding — check the keep_warm.* entries in the Render logs.`);
  } else {
    stamp(`backend healthy in ${seconds(backend.totalMs)}`);
  }
  if (proxy && !proxy.ok) {
    annotate('error', 'Backend is up but the Vercel /api proxy is not serving it — check vercel.json.');
  }

  writeSummary([
    '### Backend keep-warm',
    '',
    '| Check | Result | Time | Attempts |',
    '|---|---|---|---|',
    `| Backend \`/health\` | ${backend.ok ? (backend.wasCold ? '⚠️ woke from sleep' : '✅ warm') : '❌ down'} | ${seconds(backend.totalMs)} | ${backend.attempts.length} |`,
    proxy ? `| Vercel \`/api/health\` | ${proxy.ok ? '✅' : '❌'} | ${seconds(proxy.totalMs)} | ${proxy.attempts.length} |` : '| Vercel `/api/health` | skipped | | |',
  ]);

  return backend.ok && (proxy === null || proxy.ok);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }

  if (opts.watchMinutes === null) {
    process.exit((await runOnce(opts)) ? 0 : 1);
  }

  // Watch mode: never exits on its own. Jittered so it never syncs with the
  // backend's own self-ping.
  let stopping = false;
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopping = true; process.exit(0); });
  while (!stopping) {
    await runOnce(opts);
    const interval = opts.watchMinutes * 60_000 * (0.85 + Math.random() * 0.3);
    await new Promise((r) => setTimeout(r, interval));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
