// Run with: node --test scripts/keep-warm.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, backoffMs, wake, parseArgs } from './keep-warm.mjs';

const headers = (h = {}) => new Headers(h);

test('classifies what Render and the app actually answer', () => {
  assert.equal(classify({ status: 200, headers: headers(), body: '{"status":"healthy"}' }), 'healthy');
  assert.equal(
    classify({ status: 429, headers: headers({ 'x-render-routing': 'hibernate-rate-limited' }), body: 'Too Many Requests' }),
    'hibernating',
  );
  assert.equal(classify({ status: 429, headers: headers(), body: 'Too Many Requests' }), 'hibernating');
  assert.equal(classify({ status: 503, headers: headers(), body: '{"status":"degraded"}' }), 'degraded');
  assert.equal(classify({ status: 503, headers: headers(), body: '<html>Service Unavailable</html>' }), 'waking');
  assert.equal(classify({ status: 502, headers: headers(), body: '' }), 'waking');
  assert.equal(classify({ error: Object.assign(new Error('t'), { name: 'TimeoutError' }) }), 'waking');
  assert.equal(classify({ status: 404, headers: headers(), body: 'Not Found' }), 'broken');
});

test('backoff grows exponentially with jitter and is capped', () => {
  assert.equal(backoffMs(1, () => 0), 2_500);
  assert.equal(backoffMs(1, () => 1), 5_000);
  assert.equal(backoffMs(3, () => 1), 20_000);
  assert.equal(backoffMs(10, () => 1), 60_000);
  assert.ok(backoffMs(10, () => 0) >= 30_000);
});

function fakeClock() {
  let t = 0;
  return { now: () => t, sleep: async (ms) => { t += ms; } };
}

function scriptedFetch(outcomes) {
  let i = 0;
  const fn = async () => {
    const o = outcomes[Math.min(i++, outcomes.length - 1)];
    if (o instanceof Error) throw o;
    return new Response(o.body ?? '', { status: o.status, headers: o.headers ?? {} });
  };
  return { fn, calls: () => i };
}

const HIBERNATING = { status: 429, body: 'Too Many Requests', headers: { 'x-render-routing': 'hibernate-rate-limited' } };
const HEALTHY = { status: 200, body: '{"status":"healthy","services":{"database":{"status":"ok"}}}' };

test('keeps retrying through hibernation until the backend answers', async () => {
  const clock = fakeClock();
  const f = scriptedFetch([HIBERNATING, HIBERNATING, HEALTHY]);
  const result = await wake('https://x/health', {
    deadlineMs: 300_000, attemptTimeoutMs: 100_000, fetchImpl: f.fn, random: () => 0.5, ...clock,
  });
  assert.equal(result.ok, true);
  assert.equal(result.wasCold, true);
  assert.equal(f.calls(), 3);
});

test('a warm backend is reported as warm', async () => {
  const clock = fakeClock();
  const result = await wake('https://x/health', {
    deadlineMs: 300_000, attemptTimeoutMs: 100_000, fetchImpl: scriptedFetch([HEALTHY]).fn, ...clock,
  });
  assert.deepEqual([result.ok, result.wasCold, result.attempts.length], [true, false, 1]);
});

test('gives up at the deadline instead of hanging', async () => {
  const clock = fakeClock();
  const f = scriptedFetch([HIBERNATING]);
  const result = await wake('https://x/health', {
    deadlineMs: 120_000, attemptTimeoutMs: 100_000, fetchImpl: f.fn, random: () => 1, ...clock,
  });
  assert.equal(result.ok, false);
  assert.ok(clock.now() < 120_000);
});

test('fails fast on a misconfigured URL', async () => {
  const clock = fakeClock();
  const f = scriptedFetch([{ status: 404, body: 'Not Found' }, HEALTHY]);
  const result = await wake('https://x/nope', {
    deadlineMs: 300_000, attemptTimeoutMs: 100_000, fetchImpl: f.fn, ...clock,
  });
  assert.equal(result.ok, false);
  assert.equal(f.calls(), 1);
});

test('honours Retry-After from the edge', async () => {
  const clock = fakeClock();
  const f = scriptedFetch([{ ...HIBERNATING, headers: { ...HIBERNATING.headers, 'retry-after': '45' } }, HEALTHY]);
  await wake('https://x/health', {
    deadlineMs: 300_000, attemptTimeoutMs: 100_000, fetchImpl: f.fn, random: () => 0, ...clock,
  });
  assert.equal(clock.now(), 45_000);
});

test('parses arguments and rejects bad ones', () => {
  assert.equal(parseArgs(['--watch', '5']).watchMinutes, 5);
  assert.equal(parseArgs(['--proxy-url', '']).proxyUrl, '');
  assert.throws(() => parseArgs(['--deadline', '-1']));
  assert.throws(() => parseArgs(['--bogus']));
});
