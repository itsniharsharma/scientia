import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { invalidate, CACHE_KEYS } from '../../shared/cache';
import type { RecordIntegrityEventsInput } from '@scientia/validators';

// Signals timed outside [startedAt − grace, submittedAt + grace] are dropped:
// monitoring only runs while the attempt is open, and the grace absorbs the
// network latency left in the clock correction below.
const EDGE_GRACE_MS = 10_000;

// A student's own client can only ever add flags against itself, so there is
// nothing to gain by forging events — this cap only bounds storage.
export const MAX_EVENTS_PER_ATTEMPT = 1000;

export async function recordIntegrityEvents(
  attemptId: string,
  studentId: string,
  input: RecordIntegrityEventsInput,
): Promise<{ accepted: number }> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      studentId: true,
      testId: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      _count: { select: { integrityEvents: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt not found');
  if (attempt.studentId !== studentId) throw new ForbiddenError('This is not your attempt');

  // Events are timed by the student's device clock, which may be off by
  // minutes. `sentAt` was read from that same clock just before sending, so
  // the difference to our clock right now is the device's skew.
  const now = Date.now();
  const skewMs = now - input.sentAt;
  const earliest = attempt.startedAt.getTime() - EDGE_GRACE_MS;
  const latest = (attempt.submittedAt?.getTime() ?? now) + EDGE_GRACE_MS;

  const rows = input.events
    .map((e) => ({
      attemptId,
      clientEventId: e.clientEventId,
      episodeId: e.episodeId,
      type: e.type,
      occurredAt: new Date(e.occurredAt + skewMs),
    }))
    .filter((r) => r.occurredAt.getTime() >= earliest && r.occurredAt.getTime() <= latest)
    .slice(0, Math.max(0, MAX_EVENTS_PER_ATTEMPT - attempt._count.integrityEvents));

  if (rows.length === 0) return { accepted: 0 };

  // Clients resend until acknowledged (and beacon on page hide), so the same
  // event can arrive several times — duplicates are ignored by the unique key.
  const { count } = await prisma.integrityEvent.createMany({ data: rows, skipDuplicates: true });

  // Teachers only see finished attempts, so only late deliveries for those
  // change the cached analytics.
  if (count > 0 && attempt.status !== 'IN_PROGRESS') {
    await invalidate(CACHE_KEYS.analytics(attempt.testId));
  }

  return { accepted: count };
}
