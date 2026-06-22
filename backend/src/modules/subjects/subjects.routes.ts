import { Router } from 'express';
import { createSubjectSchema, updateSubjectSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import * as SubjectsController from './subjects.controller';

const router = Router();

router.use(authenticate, requireRole('TEACHER'));

router.get('/', SubjectsController.list);
router.get('/:id', SubjectsController.getById);
router.post('/', validate(createSubjectSchema), SubjectsController.create);
router.patch('/:id', validate(updateSubjectSchema), SubjectsController.update);
router.delete('/:id', SubjectsController.remove);

export default router;
