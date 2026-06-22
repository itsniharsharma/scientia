import { Router } from 'express';
import { createChapterSchema, updateChapterSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as ChaptersController from './chapters.controller';

// Mounted at /subjects/:subjectId/chapters — mergeParams exposes :subjectId
export const subjectChaptersRouter = Router({ mergeParams: true });
subjectChaptersRouter.use(authenticate, requireRole('TEACHER'));
subjectChaptersRouter.get('/', ChaptersController.list);
subjectChaptersRouter.post(
  '/',
  validate(createChapterSchema),
  ChaptersController.create,
);

// Mounted at /chapters
export const chaptersRouter = Router();
chaptersRouter.use(authenticate, requireRole('TEACHER'));
chaptersRouter.get('/:id', ChaptersController.getById);
chaptersRouter.patch(
  '/:id',
  validate(updateChapterSchema),
  ChaptersController.update,
);
chaptersRouter.delete('/:id', ChaptersController.remove);
