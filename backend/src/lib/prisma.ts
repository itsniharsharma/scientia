import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../shared/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Caps how long a *new* connection attempt to Postgres/the Supabase pooler
// can hang before failing with a clear error. Without this, a starved
// pooler (e.g. its connection slots full of orphaned connections from a
// prior crash-loop) causes new connections to stall at the TCP level with
// no timeout of their own — the only thing that eventually gave up was
// this app's unrelated 30s request-timeout middleware, which just logs a
// generic "Request timeout" with no indication the DB was the cause. This
// makes that failure mode surface immediately as a real Prisma connection
// error instead. Only appended if the env var didn't already specify one.
function withConnectTimeout(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '10');
    }
    return parsed.toString();
  } catch {
    // Malformed URL — let Prisma's own parser surface the real error.
    return url;
  }
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasources: {
      db: { url: withConnectTimeout(process.env.DATABASE_URL ?? '') },
    },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
    ],
  });

  (client as PrismaClient & { $on(event: 'query', cb: (e: Prisma.QueryEvent) => void): void })
    .$on('query', (e: Prisma.QueryEvent) => {
      if (e.duration > 1000) {
        logger.warn('Slow query detected', {
          durationMs: e.duration,
          query: e.query.slice(0, 300),
          params: e.params.slice(0, 200),
        });
      }
    });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
