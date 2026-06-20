import { Router } from 'express';
import { createChapterSchema, updateChapterSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import * as ChaptersController from './chapters.controller';

// Mounted at /subjects/:subjectId/chapters — mergeParams exposes :subjectId
export const subjectChaptersRouter = Router({ mergeParams: true });
subjectChaptersRouter.get('/', ChaptersController.list);
subjectChaptersRouter.post(
  '/',
  validate(createChapterSchema),
  ChaptersController.create,
);

// Mounted at /chapters
export const chaptersRouter = Router();
chaptersRouter.get('/:id', ChaptersController.getById);
chaptersRouter.patch(
  '/:id',
  validate(updateChapterSchema),
  ChaptersController.update,
);
chaptersRouter.delete('/:id', ChaptersController.remove);
