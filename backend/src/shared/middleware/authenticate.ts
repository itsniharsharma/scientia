import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@scientia/types';
import { UnauthorizedError } from '../errors';

interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authorization header is missing or malformed'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Token is invalid or expired'));
  }
}
