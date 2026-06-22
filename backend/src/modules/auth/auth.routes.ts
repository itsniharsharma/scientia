import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginTeacherSchema,
} from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import * as AuthController from './auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registrations from this IP, try again later' },
});

// POST /auth/student/register
router.post(
  '/student/register',
  registerLimiter,
  validate(registerStudentSchema),
  AuthController.registerStudent,
);

// POST /auth/student/login
router.post(
  '/student/login',
  authLimiter,
  validate(loginStudentSchema),
  AuthController.loginStudent,
);

// POST /auth/teacher/login
router.post(
  '/teacher/login',
  authLimiter,
  validate(loginTeacherSchema),
  AuthController.loginTeacher,
);

// POST /auth/logout
router.post('/logout', AuthController.logout);

// GET /auth/me  (requires a valid JWT)
router.get('/me', authenticate, AuthController.me);

export default router;
