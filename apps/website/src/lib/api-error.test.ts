import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiErrorMessage,
  isBackendUnavailable,
  withBackendWake,
  SERVER_UNREACHABLE_MESSAGE,
  SERVER_UNAVAILABLE_MESSAGE,
} from './api-error.ts';

const FALLBACK = 'Something went wrong. Please try again.';

test('returns the server message when the backend answered', () => {
  const err = { response: { status: 401, data: { error: 'Invalid username or password' } } };
  assert.equal(getApiErrorMessage(err, FALLBACK), 'Invalid username or password');
});

test('a timeout (no response) is reported as unreachable, not as bad credentials', () => {
  // Shape of an axios ECONNABORTED error: no `response` property.
  const err = { code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' };
  assert.equal(getApiErrorMessage(err, FALLBACK), SERVER_UNREACHABLE_MESSAGE);
});

test('a proxy gateway error without a JSON body is reported as unavailable', () => {
  const err = { response: { status: 504, data: 'An error occurred with your deployment' } };
  assert.equal(getApiErrorMessage(err, FALLBACK), SERVER_UNAVAILABLE_MESSAGE);
});

test('a JSON error from the app takes precedence even on a 503', () => {
  const err = { response: { status: 503, data: { error: 'Database unavailable' } } };
  assert.equal(getApiErrorMessage(err, FALLBACK), 'Database unavailable');
});

test('falls back for any other response without a usable message', () => {
  const err = { response: { status: 400, data: { error: { issues: [] } } } };
  assert.equal(getApiErrorMessage(err, FALLBACK), FALLBACK);
});

test('handles non-object errors', () => {
  assert.equal(getApiErrorMessage(undefined, FALLBACK), SERVER_UNREACHABLE_MESSAGE);
  assert.equal(getApiErrorMessage(null, FALLBACK), SERVER_UNREACHABLE_MESSAGE);
});

test("Render's plain-text 429 while hibernating is reported as unavailable", () => {
  // What the Vercel proxy relays when Render refuses to wake the backend:
  // `x-render-routing: hibernate-rate-limited`, body "Too Many Requests".
  const err = { response: { status: 429, data: 'Too Many Requests' } };
  assert.equal(getApiErrorMessage(err, FALLBACK), SERVER_UNAVAILABLE_MESSAGE);
  assert.equal(isBackendUnavailable(err), true);
});

test("the app's own JSON 429 is the backend's verdict, not an outage", () => {
  const message = 'Too many failed attempts for this account, please try again later';
  const err = { response: { status: 429, data: { error: message } } };
  assert.equal(isBackendUnavailable(err), false);
  assert.equal(getApiErrorMessage(err, FALLBACK), message);
});

test('wrong credentials are never treated as an outage', () => {
  const err = { response: { status: 401, data: { error: 'Invalid username or password' } } };
  assert.equal(isBackendUnavailable(err), false);
});

// ── withBackendWake ─────────────────────────────────────────────────────────

const hibernating = () => ({ response: { status: 429, data: 'Too Many Requests' } });
const timedOut = () => ({ code: 'ECONNABORTED' });
const wrongPassword = () => ({ response: { status: 401, data: { error: 'Invalid username or password' } } });

function scripted(outcomes: Array<'ok' | (() => unknown)>) {
  let calls = 0;
  const request = async () => {
    const outcome = outcomes[calls++];
    if (outcome === 'ok') return 'logged-in';
    throw outcome();
  };
  return { request, calls: () => calls };
}

function countingWake() {
  let wakes = 0;
  return { wake: async () => void wakes++, wakes: () => wakes };
}

test('wakes the backend and retries when the edge refuses a hibernating backend', async () => {
  const r = scripted([hibernating, 'ok']);
  const w = countingWake();
  assert.equal(await withBackendWake(r.request, w.wake, { retryOnNoResponse: true }), 'logged-in');
  assert.equal(r.calls(), 2);
  assert.equal(w.wakes(), 1);
});

test('retries a login that timed out during a cold start', async () => {
  const r = scripted([timedOut, 'ok']);
  const w = countingWake();
  assert.equal(await withBackendWake(r.request, w.wake, { retryOnNoResponse: true }), 'logged-in');
  assert.equal(w.wakes(), 1);
});

test('never retries wrong credentials', async () => {
  const r = scripted([wrongPassword, 'ok']);
  const w = countingWake();
  await assert.rejects(withBackendWake(r.request, w.wake, { retryOnNoResponse: true }));
  assert.equal(r.calls(), 1);
  assert.equal(w.wakes(), 0);
});

test('does not repeat a non-idempotent request after a lost response', async () => {
  const r = scripted([timedOut, 'ok']);
  const w = countingWake();
  await assert.rejects(withBackendWake(r.request, w.wake, { retryOnNoResponse: false }));
  assert.equal(r.calls(), 1);
});

test('still retries a non-idempotent request the edge refused (app never saw it)', async () => {
  const r = scripted([hibernating, 'ok']);
  const w = countingWake();
  assert.equal(await withBackendWake(r.request, w.wake, { retryOnNoResponse: false }), 'logged-in');
});

test('gives up after a bounded number of retries and surfaces the last error', async () => {
  const r = scripted([hibernating, hibernating, hibernating, 'ok']);
  const w = countingWake();
  await assert.rejects(
    withBackendWake(r.request, w.wake, { retryOnNoResponse: true }),
    (e: unknown) => (e as { response: { status: number } }).response.status === 429,
  );
  assert.equal(r.calls(), 3);
  assert.equal(w.wakes(), 2);
});
