import { Request, Response, NextFunction } from 'express';
import * as QuestionsService from './questions.service';

export async function list(
  req: Request<{ topicId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const questions = await QuestionsService.getAllQuestions(req.params.topicId);
    res.json(questions);
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
    const question = await QuestionsService.getQuestionById(req.params.id);
    res.json(question);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<{ topicId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const question = await QuestionsService.createQuestion(
      req.params.topicId,
      req.body,
    );
    res.status(201).json(question);
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
    const question = await QuestionsService.updateQuestion(
      req.params.id,
      req.body,
    );
    res.json(question);
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
    await QuestionsService.deleteQuestion(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
