import { Request, Response, NextFunction } from 'express';
import * as TestsService from './tests.service';

export async function generateTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await TestsService.generateTest(req.user!.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listTests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tests = await TestsService.listTests(req.user!.userId);
    res.json(tests);
  } catch (err) {
    next(err);
  }
}

export async function getTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const test = await TestsService.getTest(req.params.testId, req.user!.userId);
    res.json(test);
  } catch (err) {
    next(err);
  }
}

export async function updateTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const test = await TestsService.updateTest(req.params.testId, req.user!.userId, req.body);
    res.json(test);
  } catch (err) {
    next(err);
  }
}

export async function deleteTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await TestsService.deleteTest(req.params.testId, req.user!.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function updateTestQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tq = await TestsService.updateTestQuestion(
      req.params.testId,
      req.params.questionId,
      req.user!.userId,
      req.body,
    );
    res.json(tq);
  } catch (err) {
    next(err);
  }
}

export async function deleteTestQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await TestsService.deleteTestQuestion(
      req.params.testId,
      req.params.questionId,
      req.user!.userId,
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function addReplacementQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tq = await TestsService.addReplacementQuestion(
      req.params.testId,
      req.user!.userId,
      req.body,
    );
    res.status(201).json(tq);
  } catch (err) {
    next(err);
  }
}

export async function reorderTestQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await TestsService.reorderTestQuestions(req.params.testId, req.user!.userId, req.body);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function getReplacementPool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pool = await TestsService.getReplacementPool(req.params.testId, req.user!.userId);
    res.json(pool);
  } catch (err) {
    next(err);
  }
}

export async function getTestAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await TestsService.getTestAnalytics(req.params.testId, req.user!.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
