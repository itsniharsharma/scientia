import { Request, Response, NextFunction } from 'express';
import * as TopicsService from './topics.service';

export async function list(
  req: Request<{ chapterId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const topics = await TopicsService.getAllTopics(req.params.chapterId);
    res.json(topics);
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
    const topic = await TopicsService.getTopicById(req.params.id);
    res.json(topic);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: Request<{ chapterId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const topic = await TopicsService.createTopic(req.params.chapterId, req.body);
    res.status(201).json(topic);
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
    const topic = await TopicsService.updateTopic(req.params.id, req.body);
    res.json(topic);
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
    await TopicsService.deleteTopic(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
