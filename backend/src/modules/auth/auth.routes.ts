import { Router } from 'express';
import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  registerStudentSchema,
  registerTeacherSchema,
  loginStudentSchema,
  loginTeacherSchema,
} from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { withTestBypass } from '../../shared/middleware/test-rate-limit';
import { UpstashRateLimitStore } from '../../lib/rate-limit-store';
import { redis } from '../../lib/redis';
import * as AuthController from './auth.controller';

const router = Router();

// When Redis is configured, rate limit counters are shared across instances and
// survive deploys. When Redis is absent (local dev), falls back to in-memory store.
// Each limiter below gets its OWN store instance — UpstashRateLimitStore keeps
// per-instance state (windowMs) set by express-rate-limit's init(), so sharing
// one instance across limiters with different windows would corrupt both.
const hasRedis = redis !== null;

// ── Coarse per-IP guard ─────────────────────────────────────────────────────
// Stops one IP from hammering the auth endpoints outright (scripted abuse,
// scanners). Deliberately generous: many students on the same school/coaching
// centre WiFi share one public IP, and a class of 30+ logging in for a
// scheduled test within the same few minutes is completely normal traffic,
// not abuse. skipSuccessfulRequests matters even more than the count — every
// successful login used to count against this budget too, so a classroom of
// exactly 20 students logging in correctly would lock out the 21st with no
// bad actor involved at all (this is what broke Sept 2026 test day).
const authLimiter = withTestBypass(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: 'Too many requests, please try again later' },
    ...(hasRedis && { store: new UpstashRateLimitStore() }),
  }),
);

// ── Per-account brute-force guard ───────────────────────────────────────────
// The actual security control credential-stuffing needs: keyed on the
// submitted username (not IP), so it can't be defeated by distributing
// attempts across many IPs, and can't be triggered by a shared classroom IP
// either since each student's own username has its own budget. Only failed
// attempts count (skipSuccessfulRequests) — a student who has already
// unlocked their own account by logging in correctly never contributes here.
function usernameKey(req: Request): string {
  const raw = (req.body as { username?: unknown } | undefined)?.username;
  const username = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  // Falls back to IP if the body has no username yet (e.g. a malformed
  // request) so this middleware never throws on unexpected input — that
  // fallback is still covered by the coarser IP limiter above. Must go
  // through express-rate-limit's own ipKeyGenerator helper rather than raw
  // req.ip — it normalizes IPv6 addresses to a /64 block so a single client
  // can't bypass the limit by cycling through the trailing bits of their own
  // IPv6 address, which the library refuses to boot without (ERR_ERL_KEY_GEN_IPV6).
  return username ? `login-user:${username}` : `login-user-ip:${ipKeyGenerator(req.ip ?? '')}`;
}

const loginBruteForceLimiter = withTestBypass(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: usernameKey,
    message: { error: 'Too many failed attempts for this account, please try again later' },
    ...(hasRedis && { store: new UpstashRateLimitStore() }),
  }),
);

const registerLimiter = withTestBypass(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registrations from this IP, try again later' },
    ...(hasRedis && { store: new UpstashRateLimitStore() }),
  }),
);

// POST /auth/student/register
router.post(
  '/student/register',
  registerLimiter,
  validate(registerStudentSchema),
  AuthController.registerStudent,
);

// POST /auth/teacher/register
router.post(
  '/teacher/register',
  registerLimiter,
  validate(registerTeacherSchema),
  AuthController.registerTeacher,
);

// POST /auth/student/login
router.post(
  '/student/login',
  authLimiter,
  loginBruteForceLimiter,
  validate(loginStudentSchema),
  AuthController.loginStudent,
);

// POST /auth/teacher/login
router.post(
  '/teacher/login',
  authLimiter,
  loginBruteForceLimiter,
  validate(loginTeacherSchema),
  AuthController.loginTeacher,
);

// POST /auth/logout
router.post('/logout', authLimiter, AuthController.logout);

// GET /auth/me  (requires a valid JWT)
router.get('/me', authenticate, AuthController.me);

export default router;
