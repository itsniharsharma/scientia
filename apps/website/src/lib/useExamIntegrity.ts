import { useEffect, useMemo, useRef, useState } from 'react';
import { recordIntegrityEvents } from './attempts.api';
import {
  createEpisodeTracker,
  createOutbox,
  isScreenshotShortcut,
  loadState,
  MAX_BATCH,
  STALE_AFTER_MS,
  STORAGE_PREFIX,
  type AwayReason,
  type IntegrityEvent,
  type KeyValueStorage,
  type SendResult,
} from './exam-integrity';

// Browser wiring for exam integrity monitoring (logic: exam-integrity.ts).
//
// What each signal catches, on every platform the exam runs on:
//   visibilitychange → hidden   switched tab or app, minimised, home screen,
//                               app switcher, screen locked (desktop, iOS, Android)
//   window blur / hasFocus()    focus went to another window or app while the exam
//                               stayed visible (split screen, second monitor),
//                               or a screen-capture overlay opened (Snipping Tool,
//                               macOS ⌘⇧5, ChromeOS capture mode)
//   pagehide / unmount          exam page closed, reloaded or navigated away from
//   keydown / keyup             screenshot shortcuts that reach the page
//
// Not detectable from any web page: the iOS/Android hardware screenshot
// buttons (no browser exposes an event for them), or a second device. A
// mobile screenshot only becomes useful once it is shared or looked up, which
// means leaving the exam app — and that IS recorded.

const POLL_MS = 1_000;
const RETRY_MS = 5_000;

function safeStorage(): KeyValueStorage | null {
  try {
    const s = window.localStorage;
    s.getItem(STORAGE_PREFIX);
    return s;
  } catch {
    return null;
  }
}

async function send(attemptId: string, events: IntegrityEvent[]): Promise<SendResult> {
  try {
    await recordIntegrityEvents(attemptId, events);
    return 'ok';
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    // These verdicts will not change on retry. Everything else (offline,
    // timeout, 5xx, 429, 401 until the student signs back in) is retried.
    return status === 400 || status === 403 || status === 404 || status === 422 ? 'drop' : 'retry';
  }
}

// Attempts with a live monitor on this page, so the leftover flusher leaves
// them alone, and unmounts that may be StrictMode's dev-only remount rather
// than the student really leaving the exam page.
const liveAttempts = new Set<string>();
const pendingExits = new Map<string, ReturnType<typeof setTimeout>>();

interface IntegrityMonitor {
  setSuspended(suspended: boolean): void;
  complete(): void;
  flush(timeoutMs: number): Promise<boolean>;
  stop(): void;
}

function startIntegrityMonitor(
  attemptId: string,
  onIncidentsChange: (count: number) => void,
): IntegrityMonitor {
  const pendingExit = pendingExits.get(attemptId);
  if (pendingExit !== undefined) {
    clearTimeout(pendingExit);
    pendingExits.delete(attemptId);
  }
  liveAttempts.add(attemptId);

  const outbox = createOutbox({
    attemptId,
    storage: safeStorage(),
    send: (events) => send(attemptId, events),
  });
  const tracker = createEpisodeTracker({
    initial: outbox.state().open,
    emit: (e) => outbox.add(e),
    onOpenChange: (open) => outbox.setOpen(open),
    onIncident: () => {
      outbox.countIncident();
      onIncidentsChange(outbox.state().incidents);
    },
  });
  onIncidentsChange(outbox.state().incidents);

  // Suspended while the page itself takes focus away (submitting, our own
  // alert dialog); completed once the attempt is submitted.
  let suspended = false;
  let completed = false;

  const visible = () => document.visibilityState === 'visible';
  const touchDevice = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const flushSoon = () => void outbox.flush();

  const leave = (reason: AwayReason) => {
    if (suspended || completed) return;
    tracker.away(reason);
  };

  const comeBack = () => {
    if (!tracker.isAway()) return;
    tracker.back();
    flushSoon();
  };

  // The page may be frozen or discarded any moment after it is hidden, and an
  // ordinary request can be cancelled by unload — a beacon is delivered
  // regardless. Best effort: the events also stay in the outbox until an
  // acknowledged request confirms them (the server ignores duplicates).
  const beacon = () => {
    const pending = outbox.state().pending;
    if (pending.length === 0 || typeof navigator.sendBeacon !== 'function') return;
    try {
      const body = JSON.stringify({ sentAt: Date.now(), events: pending.slice(0, MAX_BATCH) });
      navigator.sendBeacon(
        `/api/attempts/${attemptId}/integrity-events`,
        new Blob([body], { type: 'text/plain;charset=UTF-8' }),
      );
    } catch {
      /* the outbox still has them */
    }
  };

  // Keep the screen on, so a phone left idle while the student thinks does
  // not auto-lock — which would otherwise read as leaving the exam.
  let wakeLock: WakeLockSentinel | null = null;
  const requestWakeLock = async () => {
    if (wakeLock || !visible() || !('wakeLock' in navigator)) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch {
      /* unsupported, low-power mode or no user gesture yet — retried on interaction */
    }
  };

  const onVisibilityChange = () => {
    if (!visible()) {
      leave('TAB_HIDDEN');
      beacon();
    } else {
      // On touch devices there is no "visible but another window has focus"
      // state, and some mobile browsers report focus late — visible means back.
      if (document.hasFocus() || touchDevice) comeBack();
      void requestWakeLock();
    }
  };
  const onBlur = (e: FocusEvent) => {
    if (e.target !== window) return;
    leave('FOCUS_LOST');
    flushSoon();
  };
  const onFocus = (e: FocusEvent) => {
    if (e.target === window && visible()) comeBack();
  };
  const onPageHide = () => {
    leave('PAGE_EXIT');
    beacon();
  };
  const onPageShow = () => {
    if (visible()) comeBack();
  };
  // Touching or typing in the exam proves the student is back, even where a
  // browser never fires focus on return.
  const onInteract = () => {
    if (visible()) comeBack();
    void requestWakeLock();
  };
  const onKey = (e: KeyboardEvent) => {
    if (isScreenshotShortcut(e)) {
      if (!suspended && !completed) {
        tracker.screenshot();
        flushSoon();
      }
      return;
    }
    if (e.type === 'keydown') onInteract();
  };

  // Polling catches what events miss: some browsers and window managers never
  // fire blur, and a return can happen without a focus event.
  let hadFocus = document.hasFocus();
  const poll = setInterval(() => {
    const hasFocus = document.hasFocus();
    if (!visible()) leave('TAB_HIDDEN');
    else if (hadFocus && !hasFocus) {
      leave('FOCUS_LOST');
      flushSoon();
    } else if (hasFocus) comeBack();
    hadFocus = hasFocus;
  }, POLL_MS);
  const retry = setInterval(() => {
    if (outbox.state().pending.length > 0) flushSoon();
  }, RETRY_MS);

  const listeners: [EventTarget, string, EventListener, AddEventListenerOptions?][] = [
    [document, 'visibilitychange', onVisibilityChange],
    [window, 'blur', onBlur as EventListener],
    [window, 'focus', onFocus as EventListener],
    [window, 'pagehide', onPageHide],
    [window, 'pageshow', onPageShow],
    [window, 'online', flushSoon],
    [window, 'pointerdown', onInteract, { capture: true, passive: true }],
    [window, 'touchstart', onInteract, { capture: true, passive: true }],
    [window, 'keydown', onKey as EventListener, { capture: true }],
    [window, 'keyup', onKey as EventListener, { capture: true }],
  ];
  for (const [target, type, fn, opts] of listeners) target.addEventListener(type, fn, opts);

  // Starting state: hidden already, or back after a reload / reopened tab that
  // left an episode open.
  if (!visible()) leave('TAB_HIDDEN');
  else comeBack();
  void requestWakeLock();
  flushSoon();

  return {
    setSuspended(value) {
      suspended = value;
    },
    complete() {
      completed = true;
      void outbox.flush().then(() => outbox.clearIfDone());
    },
    flush(timeoutMs) {
      return Promise.race([
        outbox.flush(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
      ]);
    },
    stop() {
      for (const [target, type, fn, opts] of listeners) target.removeEventListener(type, fn, opts);
      clearInterval(poll);
      clearInterval(retry);
      void wakeLock?.release().catch(() => undefined);
      liveAttempts.delete(attemptId);

      // Unmounted mid-exam (e.g. the browser's back button): the student left
      // the exam page. Deferred so StrictMode's immediate dev remount, which
      // cancels it above, is not mistaken for that.
      if (!completed && !suspended) {
        pendingExits.set(
          attemptId,
          setTimeout(() => {
            pendingExits.delete(attemptId);
            tracker.away('PAGE_EXIT');
            void outbox.flush();
          }, 0),
        );
      }
    },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface ExamIntegrity {
  // Times this student has left the exam window or pressed a screenshot key.
  incidents: number;
  // Call before submitting: stops our own submit flow (and its error alert)
  // from being recorded, and delivers outstanding events first.
  beginSubmit(): Promise<void>;
  endSubmit(submitted: boolean): void;
}

const SUBMIT_FLUSH_TIMEOUT_MS = 4_000;

export function useExamIntegrity(attemptId: string | undefined, active: boolean): ExamIntegrity {
  const [incidents, setIncidents] = useState(() => {
    const storage = safeStorage();
    return attemptId && storage ? loadState(storage, attemptId).incidents : 0;
  });
  const monitorRef = useRef<IntegrityMonitor | null>(null);

  useEffect(() => {
    if (!attemptId || !active) return;
    const monitor = startIntegrityMonitor(attemptId, setIncidents);
    monitorRef.current = monitor;
    return () => {
      monitorRef.current = null;
      monitor.stop();
    };
  }, [attemptId, active]);

  return useMemo(
    () => ({
      incidents,
      async beginSubmit() {
        const monitor = monitorRef.current;
        if (!monitor) return;
        monitor.setSuspended(true);
        // Bounded: a slow integrity request must never block a submission.
        // Anything left over stays queued and is delivered later.
        await monitor.flush(SUBMIT_FLUSH_TIMEOUT_MS);
      },
      endSubmit(submitted) {
        const monitor = monitorRef.current;
        if (!monitor) return;
        if (submitted) monitor.complete();
        else monitor.setSuspended(false);
      },
    }),
    [incidents],
  );
}

// ─── Leftovers ────────────────────────────────────────────────────────────────

// Delivers events still queued from earlier exams — e.g. the network dropped
// right after a submit, or the tab was closed mid-exam and the test finished
// on another device. Safe to call any time; the server ignores duplicates.
export function flushStoredIntegrityEvents(): void {
  const storage = safeStorage();
  if (!storage) return;

  const attemptIds: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) attemptIds.push(key.slice(STORAGE_PREFIX.length));
    }
  } catch {
    return;
  }

  for (const attemptId of attemptIds) {
    if (liveAttempts.has(attemptId)) continue;
    const state = loadState(storage, attemptId);
    if (Date.now() - state.updatedAt > STALE_AFTER_MS) {
      storage.removeItem(`${STORAGE_PREFIX}${attemptId}`);
      continue;
    }
    if (state.pending.length === 0) continue;
    const outbox = createOutbox({ attemptId, storage, send: (events) => send(attemptId, events) });
    void outbox.flush().then(() => outbox.clearIfDone());
  }
}
