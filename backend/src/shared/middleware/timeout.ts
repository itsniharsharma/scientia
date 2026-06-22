import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

const TIMEOUT_MS = 30_000;

export function requestTimeout(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  const timer = setTimeout(() => {
    const duration = Date.now() - start;
    logger.warn('Request timeout', {
      reqId: req.reqId,
      method: req.method,
      path: req.path,
      durationMs: duration,
      event: 'timeout',
    });

    if (!res.headersSent) {
      res.status(504).json({ error: 'Gateway Timeout' });
    }
  }, TIMEOUT_MS);

  // Node keeps the process alive while a timer is pending — unref so it doesn't
  // block graceful shutdown if the response finishes first.
  timer.unref();

  const cleanup = () => clearTimeout(timer);
  res.on('finish', cleanup);
  res.on('close', cleanup);

  next();
}
