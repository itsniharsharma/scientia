import { Router } from 'express';
import {
  generateTestSchema,
  updateTestSchema,
  updateTestQuestionSchema,
  addReplacementQuestionSchema,
  reorderTestQuestionsSchema,
} from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as TestsController from './tests.controller';

const router = Router();

// All test routes require a valid Teacher JWT
router.use(authenticate, requireRole('TEACHER'));

// Test CRUD
router.post('/generate', validate(generateTestSchema), TestsController.generateTest);
router.get('/', TestsController.listTests);
router.get('/:testId', TestsController.getTest);
router.patch('/:testId', validate(updateTestSchema), TestsController.updateTest);
router.delete('/:testId', TestsController.deleteTest);

// Replacement pool (must come BEFORE /:testId/questions/:questionId to avoid route shadowing)
router.get('/:testId/replacement-pool', TestsController.getReplacementPool);

// Analytics
router.get('/:testId/analytics', TestsController.getTestAnalytics);

// TestQuestion operations
router.post(
  '/:testId/questions/replacement',
  validate(addReplacementQuestionSchema),
  TestsController.addReplacementQuestion,
);
router.patch(
  '/:testId/questions/reorder',
  validate(reorderTestQuestionsSchema),
  TestsController.reorderTestQuestions,
);
router.patch(
  '/:testId/questions/:questionId',
  validate(updateTestQuestionSchema),
  TestsController.updateTestQuestion,
);
router.delete('/:testId/questions/:questionId', TestsController.deleteTestQuestion);

export default router;
