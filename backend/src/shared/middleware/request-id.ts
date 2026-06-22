import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      reqId: string;
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.reqId = randomUUID();
  res.setHeader('X-Request-Id', req.reqId);
  next();
}
