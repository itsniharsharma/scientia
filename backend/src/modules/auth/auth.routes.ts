import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerStudentSchema,
  loginStudentSchema,
  loginTeacherSchema,
} from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { UpstashRateLimitStore } from '../../lib/rate-limit-store';
import { redis } from '../../lib/redis';
import * as AuthController from './auth.controller';

const router = Router();

// When Redis is configured, rate limit counters are shared across instances and
// survive deploys. When Redis is absent (local dev), falls back to in-memory store.
const redisStore = redis !== null ? new UpstashRateLimitStore() : undefined;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  ...(redisStore && { store: redisStore }),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registrations from this IP, try again later' },
  ...(redisStore && { store: new UpstashRateLimitStore() }),
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
