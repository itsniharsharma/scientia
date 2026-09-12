import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerOrganisationSchema, assignStudentToOrganisationSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import { withTestBypass } from '../../shared/middleware/test-rate-limit';
import { UpstashRateLimitStore } from '../../lib/rate-limit-store';
import { redis } from '../../lib/redis';
import * as OrganisationsController from './organisations.controller';

const router = Router();

const redisStore = redis !== null ? new UpstashRateLimitStore() : undefined;

const registerLimiter = withTestBypass(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many organisation registrations from this IP, try again later' },
    ...(redisStore && { store: redisStore }),
  }),
);

// Public — an organisation must exist before a teacher can select it at
// signup, so both creating and listing organisations happen before anyone
// is authenticated. Organisation names are not sensitive data.
router.post('/register', registerLimiter, validate(registerOrganisationSchema), OrganisationsController.registerOrganisation);
router.get('/', OrganisationsController.listOrganisations);

// Everything below requires an authenticated TEACHER, and every handler
// additionally verifies (server-side, inside the service) that the teacher
// is actually a member of :organisationId before touching its data.
router.use(authenticate, requireRole('TEACHER'));

router.get('/mine', OrganisationsController.listMyOrganisations);
router.post('/:organisationId/join', OrganisationsController.joinOrganisation);
router.get('/:organisationId/students', OrganisationsController.listOrganisationStudents);
router.post(
  '/:organisationId/students',
  validate(assignStudentToOrganisationSchema),
  OrganisationsController.assignStudent,
);

export default router;
