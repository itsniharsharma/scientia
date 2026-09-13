import { Request, Response, NextFunction } from 'express';
import { getRagService } from './rag.service';

export async function queryKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getRagService().queryKnowledge(req.body.query, req.body.history);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getRagService().healthCheck();
    res.json(result);
  } catch (err) {
    next(err);
  }
}
