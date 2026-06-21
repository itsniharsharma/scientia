import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import { createBatchSchema, updateBatchSchema, addStudentToBatchSchema } from '@scientia/validators';
import * as BatchesController from './batches.controller';

const router = Router();

router.use(authenticate, requireRole('TEACHER'));

router.get('/', BatchesController.listBatches);
router.post('/', validate(createBatchSchema), BatchesController.createBatch);
router.get('/:batchId', BatchesController.getBatch);
router.patch('/:batchId', validate(updateBatchSchema), BatchesController.updateBatch);
router.post('/:batchId/students', validate(addStudentToBatchSchema), BatchesController.addStudentToBatch);
router.delete('/:batchId/students/:studentId', BatchesController.removeStudentFromBatch);

export default router;
