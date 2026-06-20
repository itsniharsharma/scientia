import { Router } from 'express';
import { createSubjectSchema, updateSubjectSchema } from '@scientia/validators';
import { validate } from '../../shared/middleware/validate';
import * as SubjectsController from './subjects.controller';

const router = Router();

router.get('/', SubjectsController.list);
router.get('/:id', SubjectsController.getById);
router.post('/', validate(createSubjectSchema), SubjectsController.create);
router.patch('/:id', validate(updateSubjectSchema), SubjectsController.update);
router.delete('/:id', SubjectsController.remove);

export default router;
