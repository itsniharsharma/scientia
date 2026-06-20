import { Request, Response, NextFunction } from 'express';
import * as SubjectsService from './subjects.service';

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subjects = await SubjectsService.getAllSubjects();
    res.json(subjects);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subject = await SubjectsService.getSubjectById(req.params.id);
    res.json(subject);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subject = await SubjectsService.createSubject(req.body);
    res.status(201).json(subject);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subject = await SubjectsService.updateSubject(req.params.id, req.body);
    res.json(subject);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await SubjectsService.deleteSubject(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
