import express, { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import {
  startAttemptSchema,
  saveResponsesSchema,
  recordIntegrityEventsSchema,
} from '@scientia/validators';
import * as AttemptsController from './attempts.controller';

const router = Router();

router.use(authenticate, requireRole('STUDENT'));

// POST /attempts — start a new attempt
router.post('/', validate(startAttemptSchema), AttemptsController.startAttempt);

// GET /attempts/:id — get attempt with questions + responses
router.get('/:id', AttemptsController.getAttempt);

// PUT /attempts/:id/responses — autosave responses
router.put('/:id/responses', validate(saveResponsesSchema), AttemptsController.saveResponses);

// POST /attempts/:id/integrity-events — tab/app switches, focus loss, screenshot keys.
// Also accepts text/plain: when the exam page is being hidden or closed the
// client sends with navigator.sendBeacon, which can only use a CORS-safelisted
// content type. The global express.json() skips such bodies; parse them here.
router.post(
  '/:id/integrity-events',
  express.json({ type: ['application/json', 'text/plain'], limit: '64kb' }),
  validate(recordIntegrityEventsSchema),
  AttemptsController.recordIntegrityEvents,
);

// POST /attempts/:id/submit — submit and score
router.post('/:id/submit', AttemptsController.submitAttempt);

// GET /attempts/:id/review — full question-by-question review (submitted attempts only)
router.get('/:id/review', AttemptsController.getAttemptReview);

export default router;
