import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';

export async function registerStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await AuthService.registerStudent(req.body);
    res.status(201).json(result);
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
    const result = await AuthService.loginStudent(req.body);
    res.json(result);
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
    const result = await AuthService.loginTeacher(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
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
