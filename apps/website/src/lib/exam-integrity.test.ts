import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEpisodeTracker,
  createOutbox,
  isScreenshotShortcut,
  loadState,
  newId,
  storageKey,
  MAX_BATCH,
  type IntegrityEvent,
  type OpenEpisode,
  type SendResult,
} from './exam-integrity.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    map,
  };
}

function harness(initial: OpenEpisode | null = null) {
  let t = 1_000;
  let n = 0;
  const events: IntegrityEvent[] = [];
  let open: OpenEpisode | null = initial;
  let incidents = 0;
  const tracker = createEpisodeTracker({
    initial,
    emit: (e) => events.push(e),
    onOpenChange: (o) => (open = o),
    onIncident: () => incidents++,
    now: () => t,
    makeId: () => `id-${++n}`,
  });
  return {
    tracker,
    events,
    open: () => open,
    incidents: () => incidents,
    advance: (ms: number) => (t += ms),
  };
}

// ── Episodes ─────────────────────────────────────────────────────────────────

test('alt-tab: focus loss then tab hidden is one episode with both signals', () => {
  const h = harness();
  h.tracker.away('FOCUS_LOST');
  h.advance(50);
  h.tracker.away('TAB_HIDDEN');
  h.advance(30_000);
  h.tracker.back();

  assert.deepEqual(
    h.events.map((e) => e.type),
    ['FOCUS_LOST', 'TAB_HIDDEN', 'RETURNED'],
  );
  assert.equal(new Set(h.events.map((e) => e.episodeId)).size, 1);
  assert.equal(h.incidents(), 1);
  assert.equal(h.open(), null);
});

test('repeated signals while already away are recorded once', () => {
  const h = harness();
  h.tracker.away('TAB_HIDDEN');
  h.tracker.away('TAB_HIDDEN');
  h.tracker.away('TAB_HIDDEN');
  assert.equal(h.events.length, 1);
});

test('coming back when not away records nothing', () => {
  const h = harness();
  h.tracker.back();
  assert.equal(h.events.length, 0);
});

test('each separate departure is its own incident', () => {
  const h = harness();
  h.tracker.away('FOCUS_LOST');
  h.tracker.back();
  h.tracker.away('FOCUS_LOST');
  h.tracker.back();
  assert.equal(h.incidents(), 2);
  assert.notEqual(h.events[0].episodeId, h.events[2].episodeId);
});

test('an episode left open by a reload is closed when the student is back', () => {
  const h = harness({ episodeId: 'before-reload', reasons: ['TAB_HIDDEN', 'PAGE_EXIT'] });
  assert.equal(h.tracker.isAway(), true);
  h.tracker.back();
  assert.deepEqual(h.events.map((e) => [e.episodeId, e.type]), [['before-reload', 'RETURNED']]);
  assert.equal(h.incidents(), 0); // already counted before the reload
});

test('one screenshot keypress (keydown + keyup) is one attempt', () => {
  const h = harness();
  h.tracker.screenshot();
  h.advance(120);
  h.tracker.screenshot();
  h.advance(5_000);
  h.tracker.screenshot();
  assert.deepEqual(h.events.map((e) => e.type), ['SCREENSHOT_KEY', 'SCREENSHOT_KEY']);
  assert.equal(h.incidents(), 2);
});

test('screenshot shortcuts across platforms', () => {
  const k = (key: string, code: string, metaKey = false, shiftKey = false) => ({ key, code, metaKey, shiftKey });
  assert.equal(isScreenshotShortcut(k('PrintScreen', 'PrintScreen')), true);
  assert.equal(isScreenshotShortcut(k('Unidentified', 'PrintScreen')), true);
  assert.equal(isScreenshotShortcut(k('#', 'Digit3', true, true)), true); // macOS ⌘⇧3
  assert.equal(isScreenshotShortcut(k('$', 'Digit4', true, true)), true); // macOS ⌘⇧4
  assert.equal(isScreenshotShortcut(k('S', 'KeyS', true, true)), true); // Win ⊞⇧S
  assert.equal(isScreenshotShortcut(k('3', 'Digit3')), false); // typing an answer
  assert.equal(isScreenshotShortcut(k('4', 'Digit4', false, true)), false);
  assert.equal(isScreenshotShortcut(k('s', 'KeyS', true)), false);
});

test('ids are UUIDs the server validator accepts', () => {
  assert.match(newId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

// ── Outbox ───────────────────────────────────────────────────────────────────

const ev = (i: number): IntegrityEvent => ({
  clientEventId: `c${i}`,
  episodeId: 'e',
  type: 'FOCUS_LOST',
  occurredAt: i,
});

test('events stay stored until the server has them', async () => {
  const storage = memoryStorage();
  let verdict: SendResult = 'retry';
  const sent: IntegrityEvent[][] = [];
  const outbox = createOutbox({
    attemptId: 'a1',
    storage,
    send: async (batch) => (sent.push(batch), verdict),
  });

  outbox.add(ev(1));
  assert.equal(await outbox.flush(), false);
  assert.equal(loadState(storage, 'a1').pending.length, 1); // survives a reload

  verdict = 'ok';
  assert.equal(await outbox.flush(), true);
  assert.equal(loadState(storage, 'a1').pending.length, 0);
  assert.equal(sent.length, 2);
});

test('a reloaded page picks up where the last one left off', async () => {
  const storage = memoryStorage();
  const first = createOutbox({ attemptId: 'a1', storage, send: async () => 'retry' });
  first.add(ev(1));
  first.setOpen({ episodeId: 'e', reasons: ['PAGE_EXIT'] });
  first.countIncident();

  const received: string[] = [];
  const second = createOutbox({
    attemptId: 'a1',
    storage,
    send: async (b) => (received.push(...b.map((e) => e.clientEventId)), 'ok'),
  });
  assert.deepEqual(second.state().open, { episodeId: 'e', reasons: ['PAGE_EXIT'] });
  assert.equal(second.state().incidents, 1);
  await second.flush();
  assert.deepEqual(received, ['c1']);
});

test('large backlogs go out in server-sized batches', async () => {
  const sizes: number[] = [];
  const outbox = createOutbox({
    attemptId: 'a1',
    storage: memoryStorage(),
    send: async (b) => (sizes.push(b.length), 'ok'),
  });
  for (let i = 0; i < MAX_BATCH + 20; i++) outbox.add(ev(i));
  await outbox.flush();
  assert.deepEqual(sizes, [MAX_BATCH, 20]);
});

test('rejected events are dropped instead of retried forever', async () => {
  const outbox = createOutbox({ attemptId: 'a1', storage: memoryStorage(), send: async () => 'drop' });
  outbox.add(ev(1));
  assert.equal(await outbox.flush(), true);
  assert.equal(outbox.state().pending.length, 0);
});

test('a throwing sender counts as retry', async () => {
  const outbox = createOutbox({
    attemptId: 'a1',
    storage: memoryStorage(),
    send: async () => {
      throw new Error('boom');
    },
  });
  outbox.add(ev(1));
  assert.equal(await outbox.flush(), false);
  assert.equal(outbox.state().pending.length, 1);
});

test('concurrent flushes never send the same event twice at once', async () => {
  let active = 0;
  let maxActive = 0;
  const outbox = createOutbox({
    attemptId: 'a1',
    storage: memoryStorage(),
    send: async () => {
      maxActive = Math.max(maxActive, ++active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return 'ok';
    },
  });
  outbox.add(ev(1));
  const a = outbox.flush();
  outbox.add(ev(2));
  const b = outbox.flush();
  assert.deepEqual(await Promise.all([a, b]), [true, true]);
  assert.equal(maxActive, 1);
  assert.equal(outbox.state().pending.length, 0);
});

test('storage is cleared only when nothing is pending and no episode is open', async () => {
  const storage = memoryStorage();
  const outbox = createOutbox({ attemptId: 'a1', storage, send: async () => 'ok' });
  outbox.setOpen({ episodeId: 'e', reasons: ['TAB_HIDDEN'] });
  outbox.clearIfDone();
  assert.ok(storage.map.has(storageKey('a1')));
  outbox.setOpen(null);
  outbox.clearIfDone();
  assert.ok(!storage.map.has(storageKey('a1')));
});

test('corrupt storage starts clean instead of crashing the exam', () => {
  const storage = memoryStorage();
  storage.setItem(storageKey('a1'), '{not json');
  assert.deepEqual(loadState(storage, 'a1').pending, []);
});
