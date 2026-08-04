import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller.js';
import { requirePermission, requireAnyPermission } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createEmployeeValidator, updateEmployeeValidator } from '../utils/employee.validator.js';
import { uploadAvatar } from '../utils/upload.js';

const router = Router();

router.get('/', requirePermission('employees.view'), EmployeeController.list);
router.get('/export', requirePermission('employees.view'), EmployeeController.exportData);
router.get('/summary', requirePermission('employees.view'), EmployeeController.summary);
router.get('/:id', requirePermission('employees.view'), EmployeeController.get);
router.post('/', requirePermission('employees.create'), validate(createEmployeeValidator), EmployeeController.create);
// Any tier of edit may PATCH; the service filters the payload to the fields the user owns.
router.put(
  '/:id',
  requireAnyPermission(['employees.edit', 'employees.it.edit', 'employees.secrets.edit', 'archiving.finalize', 'archiving.initiate', 'archiving.unarchive']),
  validate(updateEmployeeValidator),
  EmployeeController.update
);
router.delete('/:id', requireAnyPermission(['archiving.finalize', 'archiving.initiate']), EmployeeController.remove);

router.post(
  '/:id/avatar',
  requireAnyPermission(['employees.edit', 'employees.it.edit', 'employees.secrets.edit']),
  uploadAvatar.single('avatar'),
  EmployeeController.uploadAvatar
);

router.post(
  '/:id/remind-it',
  requirePermission('employees.edit'),
  EmployeeController.remindIT
);

router.post(
  '/:id/notify-it',
  requirePermission('employees.edit'),
  EmployeeController.notifyIT
);

export default router;
