import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireRole } from '../shared/middleware/require-role';
import { ForbiddenError } from '../shared/errors';

// ─── Unit tests for the role-based authorization gate applied after authenticate ─

function fakeReq(user?: { userId: string; role: 'TEACHER' | 'STUDENT' }): Request {
  return { user } as unknown as Request;
}

const fakeRes = {} as Response;

describe('requireRole middleware', () => {
  it('rejects with ForbiddenError when req.user is missing (authenticate did not run or failed silently)', () => {
    const next = vi.fn();
    requireRole('TEACHER')(fakeReq(undefined), fakeRes, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe('Authentication required');
  });

  it('rejects a STUDENT hitting a TEACHER-only route', () => {
    const next = vi.fn();
    requireRole('TEACHER')(fakeReq({ userId: 's1', role: 'STUDENT' }), fakeRes, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.message).toBe('You do not have permission to access this resource');
  });

  it('rejects a TEACHER hitting a STUDENT-only route', () => {
    const next = vi.fn();
    requireRole('STUDENT')(fakeReq({ userId: 't1', role: 'TEACHER' }), fakeRes, next as NextFunction);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('allows a TEACHER through a TEACHER-only route', () => {
    const next = vi.fn();
    requireRole('TEACHER')(fakeReq({ userId: 't1', role: 'TEACHER' }), fakeRes, next as NextFunction);

    expect(next).toHaveBeenCalledWith(); // called with no error argument
  });

  it('allows either role through when both are listed', () => {
    const next = vi.fn();
    requireRole('TEACHER', 'STUDENT')(fakeReq({ userId: 's1', role: 'STUDENT' }), fakeRes, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });
});
