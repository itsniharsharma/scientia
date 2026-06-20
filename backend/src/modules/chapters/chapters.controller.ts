import { Request, Response, NextFunction } from 'express';
import * as ChaptersService from './chapters.service';

export async function list(
  req: Request<{ subjectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapters = await ChaptersService.getAllChapters(req.params.subjectId);
    res.json(chapters);
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
    const chapter = await ChaptersService.getChapterById(req.params.id);
    res.json(chapter);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<{ subjectId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const chapter = await ChaptersService.createChapter(
      req.params.subjectId,
      req.body,
    );
    res.status(201).json(chapter);
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
    const chapter = await ChaptersService.updateChapter(
      req.params.id,
      req.body,
    );
    res.json(chapter);
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
    await ChaptersService.deleteChapter(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
