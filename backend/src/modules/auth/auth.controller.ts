import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';

const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function registerStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, user } = await AuthService.registerStudent(req.body);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, user } = await AuthService.loginStudent(req.body);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginTeacher(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { token, user } = await AuthService.loginTeacher(req.body);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(204).end();
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, role } = req.user!;
    const user = await AuthService.getCurrentUser(userId, role);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
