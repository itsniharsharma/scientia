import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@scientia/types';
import { ForbiddenError } from '../errors';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }
    next();
  };
}
