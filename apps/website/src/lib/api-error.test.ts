import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiErrorMessage,
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
