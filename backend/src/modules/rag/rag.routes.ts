import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { queryKnowledgeSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { withTestBypass } from '../../shared/middleware/test-rate-limit';
import { UpstashRateLimitStore } from '../../lib/rate-limit-store';
import { redis } from '../../lib/redis';
import * as RagController from './rag.controller';

const router = Router();

// Each query costs a real Voyage embedding call and (unless cached) a real
// Gemini generation call — both metered, both on tight free-tier limits.
// Without a limit here, one authenticated user (or a client-side bug that
// loops) can exhaust the day's Gemini quota alone. 20 requests / 5 minutes
// comfortably covers real chat usage while bounding worst-case spend.
const queryLimiter = withTestBypass(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many questions in a short time — please wait a few minutes and try again.' },
    ...(redis !== null && { store: new UpstashRateLimitStore() }),
  }),
);

// Helpdesk knowledge is not organisation- or role-specific — any
// authenticated Scientia user (student or teacher) can ask it questions.
router.post('/query', authenticate, queryLimiter, validate(queryKnowledgeSchema), RagController.queryKnowledge);
router.get('/health', RagController.healthCheck);

export default router;
