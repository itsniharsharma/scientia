import { Request, Response, NextFunction } from 'express';
import * as BatchesService from './batches.service';

export async function listBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batches = await BatchesService.listBatches(req.user!.userId);
    res.json(batches);
  } catch (err) { next(err); }
}

export async function createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await BatchesService.createBatch(req.user!.userId, req.body);
    res.status(201).json(batch);
  } catch (err) { next(err); }
}

export async function getBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await BatchesService.getBatch(req.params.batchId, req.user!.userId);
    res.json(batch);
  } catch (err) { next(err); }
}

export async function updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await BatchesService.updateBatch(req.params.batchId, req.user!.userId, req.body);
    res.json(batch);
  } catch (err) { next(err); }
}

export async function addStudentToBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const student = await BatchesService.addStudentToBatch(req.params.batchId, req.user!.userId, req.body);
    res.status(201).json(student);
  } catch (err) { next(err); }
}

export async function removeStudentFromBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await BatchesService.removeStudentFromBatch(req.params.batchId, req.user!.userId, req.params.studentId);
    res.status(204).end();
  } catch (err) { next(err); }
}
