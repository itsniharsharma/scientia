import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../shared/middleware/authenticate';
import { UnauthorizedError } from '../shared/errors';

// ─── Unit tests for the sole authentication gate on every protected route ─────

function fakeReq(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    headers: {},
    path: '/test',
    ...overrides,
  } as unknown as Request;
}

const fakeRes = {} as Response;

function validToken(payload: Record<string, unknown> = { sub: 'user-1', role: 'TEACHER' }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

describe('authenticate middleware', () => {
  it('rejects with UnauthorizedError when no cookie or bearer token is present', () => {
    const next = vi.fn();
    authenticate(fakeReq(), fakeRes, next as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('No authentication token provided');
  });

  it('accepts a valid cookie token and sets req.user from the payload', () => {
    const req = fakeReq({ cookies: { auth_token: validToken({ sub: 'teacher-42', role: 'TEACHER' }) } });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.user).toEqual({ userId: 'teacher-42', role: 'TEACHER' });
  });

  it('accepts a valid Bearer header token when no cookie is present', () => {
    const req = fakeReq({
      headers: { authorization: `Bearer ${validToken({ sub: 'student-7', role: 'STUDENT' })}` },
    });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ userId: 'student-7', role: 'STUDENT' });
  });

  it('prefers the cookie over the Bearer header when both are present', () => {
    const req = fakeReq({
      cookies: { auth_token: validToken({ sub: 'cookie-user', role: 'TEACHER' }) },
      headers: { authorization: `Bearer ${validToken({ sub: 'bearer-user', role: 'STUDENT' })}` },
    });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    expect(req.user?.userId).toBe('cookie-user');
  });

  it('rejects a token signed with the wrong secret', () => {
    const req = fakeReq({
      cookies: { auth_token: jwt.sign({ sub: 'x', role: 'TEACHER' }, 'wrong-secret', { expiresIn: '7d' }) },
    });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Token is invalid or expired');
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: 'x', role: 'TEACHER' }, process.env.JWT_SECRET!, { expiresIn: '-1s' });
    const req = fakeReq({ cookies: { auth_token: expired } });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.message).toBe('Token is invalid or expired');
  });

  it('rejects a malformed token string', () => {
    const req = fakeReq({ cookies: { auth_token: 'not-a-real-jwt' } });
    const next = vi.fn();

    authenticate(req, fakeRes, next as NextFunction);

    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it('never sets req.user when authentication fails', () => {
    const req = fakeReq({ cookies: { auth_token: 'garbage' } });
    authenticate(req, fakeRes, vi.fn() as unknown as NextFunction);
    expect(req.user).toBeUndefined();
  });
});
