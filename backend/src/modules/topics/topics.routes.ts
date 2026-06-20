import { Router } from 'express';
import { createTopicSchema, updateTopicSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import * as TopicsController from './topics.controller';

// Mounted at /chapters/:chapterId/topics — mergeParams exposes :chapterId
export const chapterTopicsRouter = Router({ mergeParams: true });
chapterTopicsRouter.get('/', TopicsController.list);
chapterTopicsRouter.post(
  '/',
  validate(createTopicSchema),
  TopicsController.create,
);

// Mounted at /topics
export const topicsRouter = Router();
topicsRouter.get('/:id', TopicsController.getById);
topicsRouter.patch(
  '/:id',
  validate(updateTopicSchema),
  TopicsController.update,
);
topicsRouter.delete('/:id', TopicsController.remove);
