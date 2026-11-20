import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {
    attempt: { findUnique: vi.fn() },
    integrityEvent: { createMany: vi.fn() },
  },
}));
vi.mock('../shared/cache', () => ({
  invalidate: vi.fn(),
  CACHE_KEYS: { analytics: (id: string) => `analytics:test:${id}` },
}));

import { prisma } from '../lib/prisma';
import { invalidate } from '../shared/cache';
import { recordIntegrityEvents, MAX_EVENTS_PER_ATTEMPT } from '../modules/attempts/integrity.service';
import { ForbiddenError, NotFoundError } from '../shared/errors';

const findUnique = prisma.attempt.findUnique as ReturnType<typeof vi.fn>;
const createMany = prisma.integrityEvent.createMany as ReturnType<typeof vi.fn>;

const NOW = Date.parse('2026-11-20T10:30:00.000Z');
const STARTED = new Date('2026-11-20T10:00:00.000Z');
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function attempt(overrides: Record<string, unknown> = {}) {
  return {
    studentId: 'stu-1',
    testId: 'test-1',
    status: 'IN_PROGRESS',
    startedAt: STARTED,
    submittedAt: null,
    _count: { integrityEvents: 0 },
    ...overrides,
  };
}

function event(n: number, occurredAt: number, type = 'TAB_HIDDEN' as const) {
  return { clientEventId: id(n), episodeId: id(100 + n), type, occurredAt };
}

describe('recordIntegrityEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    createMany.mockImplementation(async ({ data }: { data: unknown[] }) => ({ count: data.length }));
  });
  afterEach(() => vi.useRealTimers());

  it('rejects another student’s attempt and unknown attempts', async () => {
    findUnique.mockResolvedValueOnce(attempt({ studentId: 'someone-else' }));
    await expect(
      recordIntegrityEvents('a1', 'stu-1', { sentAt: NOW, events: [event(1, NOW)] }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    findUnique.mockResolvedValueOnce(null);
    await expect(
      recordIntegrityEvents('a1', 'stu-1', { sentAt: NOW, events: [event(1, NOW)] }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(createMany).not.toHaveBeenCalled();
  });

  it('corrects the device clock using sentAt', async () => {
    findUnique.mockResolvedValue(attempt());
    const deviceSlowBy = 7 * 60_000; // device clock is 7 minutes behind
    const happened = NOW - 60_000;   // really one minute ago
    await recordIntegrityEvents('a1', 'stu-1', {
      sentAt: NOW - deviceSlowBy,
      events: [event(1, happened - deviceSlowBy)],
    });
    const row = createMany.mock.calls[0][0].data[0];
    expect(row.occurredAt.getTime()).toBe(happened);
    expect(createMany.mock.calls[0][0].skipDuplicates).toBe(true);
  });

  it('drops signals timed outside the attempt', async () => {
    findUnique.mockResolvedValue(
      attempt({ status: 'SUBMITTED', submittedAt: new Date(NOW - 5 * 60_000) }),
    );
    const result = await recordIntegrityEvents('a1', 'stu-1', {
      sentAt: NOW,
      events: [
        event(1, STARTED.getTime() - 60_000), // before the attempt began
        event(2, NOW - 10 * 60_000),          // during — kept
        event(3, NOW - 60_000),               // after submission
      ],
    });
    expect(result.accepted).toBe(1);
    expect(createMany.mock.calls[0][0].data.map((r: { clientEventId: string }) => r.clientEventId)).toEqual([id(2)]);
  });

  it('accepts late deliveries for a submitted attempt and refreshes the teacher’s analytics', async () => {
    findUnique.mockResolvedValue(attempt({ status: 'SUBMITTED', submittedAt: new Date(NOW - 60_000) }));
    await recordIntegrityEvents('a1', 'stu-1', { sentAt: NOW, events: [event(1, NOW - 2 * 60_000)] });
    expect(invalidate).toHaveBeenCalledWith('analytics:test:test-1');
  });

  it('does not touch the cache while the attempt is still in progress', async () => {
    findUnique.mockResolvedValue(attempt());
    await recordIntegrityEvents('a1', 'stu-1', { sentAt: NOW, events: [event(1, NOW)] });
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('stops storing at the per-attempt cap', async () => {
    findUnique.mockResolvedValue(attempt({ _count: { integrityEvents: MAX_EVENTS_PER_ATTEMPT - 1 } }));
    const result = await recordIntegrityEvents('a1', 'stu-1', {
      sentAt: NOW,
      events: [event(1, NOW), event(2, NOW), event(3, NOW)],
    });
    expect(result.accepted).toBe(1);

    findUnique.mockResolvedValue(attempt({ _count: { integrityEvents: MAX_EVENTS_PER_ATTEMPT } }));
    createMany.mockClear();
    expect((await recordIntegrityEvents('a1', 'stu-1', { sentAt: NOW, events: [event(4, NOW)] })).accepted).toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });
});
