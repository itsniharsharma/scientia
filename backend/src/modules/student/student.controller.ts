import { Request, Response, NextFunction } from 'express';
import * as StudentService from './student.service';

export async function listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await StudentService.listStudentBatches(req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await StudentService.getStudentBatch(req.params.batchId, req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await StudentService.getStudentProfile(req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await StudentService.listStudentAttempts(req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
}
