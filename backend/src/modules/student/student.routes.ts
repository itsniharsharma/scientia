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

// Organisation assignments — READ ONLY. Students can view which
// organisations they belong to but there is deliberately no write route
// here: self-assignment, self-removal, and switching organisations are not
// possible because no such endpoint exists under this STUDENT-only router.
router.get('/organisations', StudentController.listMyOrganisations);

export default router;
