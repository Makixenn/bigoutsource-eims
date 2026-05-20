import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createEmployeeValidator, updateEmployeeValidator } from '../validators/employee.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_admin', 'it_admin', 'viewer'), EmployeeController.list);
router.get('/:id', authorize('super_admin', 'hr_admin', 'it_admin', 'viewer'), EmployeeController.get);
router.post('/', authorize('super_admin', 'hr_admin'), validate(createEmployeeValidator), EmployeeController.create);
router.put('/:id', authorize('super_admin', 'hr_admin'), validate(updateEmployeeValidator), EmployeeController.update);
router.delete('/:id', authorize('super_admin'), EmployeeController.remove);

export default router;
