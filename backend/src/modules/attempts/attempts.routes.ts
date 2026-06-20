import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import { startAttemptSchema, saveResponsesSchema } from '@scientia/validators';
import * as AttemptsController from './attempts.controller';

const router = Router();

router.use(authenticate, requireRole('STUDENT'));

// POST /attempts — start a new attempt
router.post('/', validate(startAttemptSchema), AttemptsController.startAttempt);

// GET /attempts/:id — get attempt with questions + responses
router.get('/:id', AttemptsController.getAttempt);

// PUT /attempts/:id/responses — autosave responses
router.put('/:id/responses', validate(saveResponsesSchema), AttemptsController.saveResponses);

// POST /attempts/:id/submit — submit and score
router.post('/:id/submit', AttemptsController.submitAttempt);

// GET /attempts/:id/review — full question-by-question review (submitted attempts only)
router.get('/:id/review', AttemptsController.getAttemptReview);

export default router;
