import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as AttemptsController from '../attempts/attempts.controller';
import * as StudentController from './student.controller';

const router = Router();

router.use(authenticate, requireRole('STUDENT'));

// Existing
router.get('/tests', AttemptsController.listScheduledTests);
router.get('/dashboard', AttemptsController.getStudentDashboard);

// Student V2
router.get('/batches', StudentController.listBatches);
router.get('/batches/:batchId', StudentController.getBatch);
router.get('/profile', StudentController.getProfile);
router.get('/attempts', StudentController.listAttempts);

export default router;
