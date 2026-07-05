import { Prisma } from '@prisma/client';
import { ConflictError } from './errors';

export function handleUniqueConstraint(message: string, err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new ConflictError(message);
  }
  throw err;
}
