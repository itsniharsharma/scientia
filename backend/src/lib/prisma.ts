import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../shared/logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
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
