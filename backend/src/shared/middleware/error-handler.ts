import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // `cause` carries the real diagnostic detail for errors whose
      // client-facing `message` is deliberately a safe, generic one (see
      // modules/rag/core/errors.ts) — log it so operators aren't left with
      // just "temporarily unavailable".
      const detail = err.cause !== undefined ? String(err.cause) : err.message;
      logger.error(detail, { path: req.path, method: req.method, status: err.statusCode });
    }
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    res.status(404).json({ error: 'Record not found' });
    return;
  }
  logger.error('Unhandled exception', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
}
