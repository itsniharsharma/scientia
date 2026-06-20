import { Request, Response, NextFunction } from 'express';
import * as AttemptsService from './attempts.service';

export async function startAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.startAttempt(userId, req.body.testId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.getAttempt(req.params.id, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function saveResponses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.saveResponses(req.params.id, userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.submitAttempt(req.params.id, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listScheduledTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.listScheduledTests(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.user!;
    const result = await AttemptsService.getStudentDashboard(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
