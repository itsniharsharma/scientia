import { Router } from 'express';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginTeacherSchema,
} from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import * as AuthController from './auth.controller';

const router = Router();

// POST /auth/student/register
router.post(
  '/student/register',
  validate(registerStudentSchema),
  AuthController.registerStudent,
);

// POST /auth/student/login
router.post(
  '/student/login',
  validate(loginStudentSchema),
  AuthController.loginStudent,
);

// POST /auth/teacher/login
router.post(
  '/teacher/login',
  validate(loginTeacherSchema),
  AuthController.loginTeacher,
);

// GET /auth/me  (requires a valid JWT)
router.get('/me', authenticate, AuthController.me);

export default router;
