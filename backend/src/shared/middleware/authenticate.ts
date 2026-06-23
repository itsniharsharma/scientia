import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@scientia/types';
import { UnauthorizedError } from '../errors';
import { logger } from '../logger';

interface JwtPayload {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  // Cookie takes priority; Bearer header retained for backwards-compat (API clients, tests)
  const cookieToken: string | undefined = req.cookies?.auth_token;
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? bearerToken;

  if (!token) {
    logger.warn('auth.rejected', {
      reason: 'no_token',
      hasCookie: false,
      hasBearer: false,
      path: req.path,
      origin: req.headers.origin ?? 'none',
      ua: (req.headers['user-agent'] ?? '').slice(0, 80),
    });
    next(new UnauthorizedError('No authentication token provided'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    logger.warn('auth.rejected', {
      reason: 'invalid_token',
      hasCookie: !!cookieToken,
      hasBearer: !!bearerToken,
      path: req.path,
      origin: req.headers.origin ?? 'none',
      ua: (req.headers['user-agent'] ?? '').slice(0, 80),
    });
    next(new UnauthorizedError('Token is invalid or expired'));
  }
}
