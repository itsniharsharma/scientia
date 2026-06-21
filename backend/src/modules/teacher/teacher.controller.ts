import { Request, Response, NextFunction } from 'express';
import * as TeacherService from './teacher.service';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await TeacherService.getTeacherProfile(req.user!.userId);
    res.json(profile);
  } catch (err) { next(err); }
}
