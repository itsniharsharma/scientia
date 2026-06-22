import { Router } from 'express';
import { createTopicSchema, updateTopicSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as TopicsController from './topics.controller';

// Mounted at /chapters/:chapterId/topics — mergeParams exposes :chapterId
export const chapterTopicsRouter = Router({ mergeParams: true });
chapterTopicsRouter.use(authenticate, requireRole('TEACHER'));
chapterTopicsRouter.get('/', TopicsController.list);
chapterTopicsRouter.post(
  '/',
  validate(createTopicSchema),
  TopicsController.create,
);

// Mounted at /topics
export const topicsRouter = Router();
topicsRouter.use(authenticate, requireRole('TEACHER'));
topicsRouter.get('/:id', TopicsController.getById);
topicsRouter.patch(
  '/:id',
  validate(updateTopicSchema),
  TopicsController.update,
);
topicsRouter.delete('/:id', TopicsController.remove);
