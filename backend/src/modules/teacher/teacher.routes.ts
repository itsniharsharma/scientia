import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as TeacherController from './teacher.controller';

const router = Router();

router.use(authenticate, requireRole('TEACHER'));

router.get('/profile', TeacherController.getProfile);

export default router;
