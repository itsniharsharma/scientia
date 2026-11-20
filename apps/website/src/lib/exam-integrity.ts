// Exam integrity: the logic behind flagging a student who leaves the exam.
//
// Kept free of DOM and network code so it can be tested in Node; the browser
// wiring lives in useExamIntegrity.ts.
//
// The model is an "away episode": one stretch of time the student spends away
// from the exam. It opens at the first sign of leaving and closes when they are
// back. While open it may escalate (focus lost → tab hidden → page closed) and
// each new reason is recorded as a signal with the same episodeId. A
// screenshot shortcut is a single-signal episode of its own.
//
// Every signal goes into a persistent outbox first and is only removed once
// the server has stored it, so signals survive reloads, crashes and outages.
// The server ignores duplicates, so resending is always safe.

export type AwayReason = 'FOCUS_LOST' | 'TAB_HIDDEN' | 'PAGE_EXIT';
export type IntegrityEventType = AwayReason | 'SCREENSHOT_KEY' | 'RETURNED';

export interface IntegrityEvent {
  clientEventId: string;
  episodeId: string;
  type: IntegrityEventType;
  occurredAt: number; // client epoch ms
}

export interface OpenEpisode {
  episodeId: string;
  reasons: AwayReason[];
}

export interface StoredIntegrityState {
  pending: IntegrityEvent[];
  open: OpenEpisode | null;
  incidents: number;
  updatedAt: number;
}

// ─── Ids ──────────────────────────────────────────────────────────────────────

// crypto.randomUUID needs a secure context and iOS 15.4+; fall back to a v4
// UUID built from getRandomValues, which every supported browser has.
export function newId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ─── Screenshot shortcuts ─────────────────────────────────────────────────────

// Only shortcuts the OS lets through to the page can be seen. PrintScreen
// usually arrives (often as keyup only, on Windows); macOS ⌘⇧3/4/5 and
// Windows ⊞⇧S are mostly swallowed by the OS — but the capture overlay they
// open takes focus from the browser, which is recorded as FOCUS_LOST anyway.
export function isScreenshotShortcut(e: {
  key: string;
  code: string;
  metaKey: boolean;
  shiftKey: boolean;
}): boolean {
  if (e.key === 'PrintScreen' || e.code === 'PrintScreen') return true;
  if (e.metaKey && e.shiftKey && /^Digit[3-6]$/.test(e.code)) return true; // macOS
  if (e.metaKey && e.shiftKey && e.code === 'KeyS') return true; // Windows Snipping Tool
  return false;
}

// keydown and keyup of one press, or a held key's auto-repeat, are one attempt.
const SCREENSHOT_DEDUPE_MS = 1500;

// ─── Episode tracker ──────────────────────────────────────────────────────────

export interface EpisodeTracker {
  away(reason: AwayReason): void;
  back(): void;
  screenshot(): void;
  isAway(): boolean;
}

export function createEpisodeTracker({
  initial,
  emit,
  onOpenChange,
  onIncident,
  now = Date.now,
  makeId = newId,
}: {
  initial: OpenEpisode | null;
  emit: (event: IntegrityEvent) => void;
  onOpenChange: (open: OpenEpisode | null) => void;
  onIncident: () => void;
  now?: () => number;
  makeId?: () => string;
}): EpisodeTracker {
  let open: OpenEpisode | null = initial;
  let lastScreenshotAt = -Infinity;

  const record = (episodeId: string, type: IntegrityEventType) =>
    emit({ clientEventId: makeId(), episodeId, type, occurredAt: now() });

  return {
    away(reason) {
      if (!open) {
        open = { episodeId: makeId(), reasons: [] };
        onIncident();
      }
      if (open.reasons.includes(reason)) return;
      open = { ...open, reasons: [...open.reasons, reason] };
      record(open.episodeId, reason);
      onOpenChange(open);
    },
    back() {
      if (!open) return;
      record(open.episodeId, 'RETURNED');
      open = null;
      onOpenChange(null);
    },
    screenshot() {
      const t = now();
      if (t - lastScreenshotAt < SCREENSHOT_DEDUPE_MS) return;
      lastScreenshotAt = t;
      record(makeId(), 'SCREENSHOT_KEY');
      onIncident();
    },
    isAway: () => open !== null,
  };
}

// ─── Outbox ───────────────────────────────────────────────────────────────────

export const STORAGE_PREFIX = 'exam_integrity_';
export const storageKey = (attemptId: string) => `${STORAGE_PREFIX}${attemptId}`;

// Matches the server's per-request limit.
export const MAX_BATCH = 100;

// Leftovers this old (an episode on a device the student never came back to)
// are dropped so storage does not grow forever.
export const STALE_AFTER_MS = 7 * 24 * 60 * 60_000;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// 'ok'    stored (or already stored) by the server
// 'drop'  the server will never accept these (attempt gone, not ours, invalid)
// 'retry' no verdict — offline, timeout, 5xx, signed out — try again later
export type SendResult = 'ok' | 'drop' | 'retry';

export function emptyState(now = Date.now()): StoredIntegrityState {
  return { pending: [], open: null, incidents: 0, updatedAt: now };
}

export function loadState(storage: KeyValueStorage, attemptId: string): StoredIntegrityState {
  try {
    const raw = storage.getItem(storageKey(attemptId));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredIntegrityState>;
      return {
        pending: Array.isArray(parsed.pending) ? parsed.pending : [],
        open: parsed.open ?? null,
        incidents: typeof parsed.incidents === 'number' ? parsed.incidents : 0,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      };
    }
  } catch {
    /* corrupt or blocked storage — start clean */
  }
  return emptyState();
}

export interface Outbox {
  state(): StoredIntegrityState;
  add(event: IntegrityEvent): void;
  setOpen(open: OpenEpisode | null): void;
  countIncident(): void;
  flush(): Promise<boolean>; // true when nothing is left pending
  clearIfDone(): void;
}

export function createOutbox({
  attemptId,
  storage,
  send,
  now = Date.now,
}: {
  attemptId: string;
  storage: KeyValueStorage | null;
  send: (events: IntegrityEvent[]) => Promise<SendResult>;
  now?: () => number;
}): Outbox {
  let state = storage ? loadState(storage, attemptId) : emptyState(now());
  let inFlight: Promise<boolean> | null = null;

  const persist = () => {
    state = { ...state, updatedAt: now() };
    try {
      storage?.setItem(storageKey(attemptId), JSON.stringify(state));
    } catch {
      /* quota or private mode — the in-memory copy still gets sent */
    }
  };

  async function drain(): Promise<boolean> {
    while (state.pending.length > 0) {
      const batch = state.pending.slice(0, MAX_BATCH);
      let result: SendResult;
      try {
        result = await send(batch);
      } catch {
        result = 'retry';
      }
      if (result === 'retry') return false;
      const sent = new Set(batch.map((e) => e.clientEventId));
      state = { ...state, pending: state.pending.filter((e) => !sent.has(e.clientEventId)) };
      persist();
    }
    return true;
  }

  return {
    state: () => state,
    add(event) {
      state = { ...state, pending: [...state.pending, event] };
      persist();
    },
    setOpen(open) {
      state = { ...state, open };
      persist();
    },
    countIncident() {
      state = { ...state, incidents: state.incidents + 1 };
      persist();
    },
    // Single-flight: overlapping calls share one drain, and a call made while
    // a drain is running waits for it and then drains anything added since.
    flush() {
      const run = (inFlight ?? Promise.resolve(true)).then(() => drain());
      const current = run.finally(() => {
        if (inFlight === current) inFlight = null;
      });
      inFlight = current;
      return current;
    },
    clearIfDone() {
      if (state.pending.length > 0 || state.open) return;
      try {
        storage?.removeItem(storageKey(attemptId));
      } catch {
        /* ignore */
      }
    },
  };
}
