import { Router } from 'express';
import { createQuestionSchema, updateQuestionSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as QuestionsController from './questions.controller';

// Mounted at /topics/:topicId/questions — mergeParams exposes :topicId
export const topicQuestionsRouter = Router({ mergeParams: true });
topicQuestionsRouter.use(authenticate, requireRole('TEACHER'));
topicQuestionsRouter.get('/', QuestionsController.list);
topicQuestionsRouter.post(
  '/',
  validate(createQuestionSchema),
  QuestionsController.create,
);

// Mounted at /questions
export const questionsRouter = Router();
questionsRouter.use(authenticate, requireRole('TEACHER'));
questionsRouter.get('/:id', QuestionsController.getById);
questionsRouter.patch(
  '/:id',
  validate(updateQuestionSchema),
  QuestionsController.update,
);
questionsRouter.delete('/:id', QuestionsController.remove);
