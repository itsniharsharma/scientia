import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestQueue } from './requestQueue.ts';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('runs tasks strictly in enqueue order even when an earlier task is slower', async () => {
  const queue = createRequestQueue();
  const started: number[] = [];
  const finished: number[] = [];

  // Task 0 is slow (simulates a laggy network request for an early answer).
  // Task 1 is fast (simulates a quick request for a later, corrected answer).
  // Without ordering, task 1 could finish first and be overwritten by task 0.
  const p0 = queue.enqueue(async () => {
    started.push(0);
    await delay(50);
    finished.push(0);
  });
  const p1 = queue.enqueue(async () => {
    started.push(1);
    await delay(0);
    finished.push(1);
  });

  await Promise.all([p0, p1]);

  assert.deepEqual(started, [0, 1]);
  assert.deepEqual(finished, [0, 1]);
});

test('settled() resolves only after every previously enqueued task has completed', async () => {
  const queue = createRequestQueue();
  let lastWritten: string | null = null;

  // Simulates the exam autosave: each save "writes" a value after a random
  // delay. This is the same shape as saveResponses() being called for
  // successive answer changes on the same question.
  function writeAnswer(value: string, ms: number) {
    return queue.enqueue(async () => {
      await delay(ms);
      lastWritten = value;
    });
  }

  writeAnswer('A', 30); // student picks A, slow request
  writeAnswer('B', 5); // student changes mind to B, fast request

  // This mirrors handleConfirmSubmit: await the queue before "submitting".
  await queue.settled();

  assert.equal(lastWritten, 'B', 'the last answer the student picked must win, not the fastest request');
});

test('a rejected task does not block later tasks or make settled() reject', async () => {
  const queue = createRequestQueue();
  const order: string[] = [];

  const failing = queue.enqueue(async () => {
    order.push('fail-start');
    throw new Error('network error');
  });
  const after = queue.enqueue(async () => {
    order.push('after');
  });

  await assert.rejects(failing);
  await after;
  await queue.settled();

  assert.deepEqual(order, ['fail-start', 'after']);
});

test('reproduces the pre-fix bug when tasks are NOT queued (fired independently)', async () => {
  // This test intentionally bypasses the queue to document the exact race
  // that used to corrupt exam answers: two unordered requests for the same
  // question, where the slower one carries the stale value.
  let dbValue: string | null = null;

  async function unorderedSave(value: string, ms: number) {
    await delay(ms);
    dbValue = value; // last request to finish wins, regardless of intent
  }

  // Student selects A (slow request), then immediately changes to B (fast request) —
  // exactly what happens when a marked question is answered right before submit.
  const saveA = unorderedSave('A', 30);
  const saveB = unorderedSave('B', 5);
  await Promise.all([saveA, saveB]);

  // Without ordering, the stale answer ('A') can win — this is the bug.
  assert.equal(dbValue, 'A', 'demonstrates the pre-fix race: stale answer overwrites the real one');
});
