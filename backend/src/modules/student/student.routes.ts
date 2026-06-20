import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as AttemptsController from '../attempts/attempts.controller';

const router = Router();

router.use(authenticate, requireRole('STUDENT'));

// GET /student/tests — all SCHEDULED tests with attempt status
router.get('/tests', AttemptsController.listScheduledTests);

// GET /student/dashboard — upcoming tests + recent attempts + stats
router.get('/dashboard', AttemptsController.getStudentDashboard);

export default router;
