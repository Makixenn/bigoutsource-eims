import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { assignDeviceValidator, createDeviceValidator, updateDeviceValidator } from '../validators/device.validator.js';

const router = Router();
const assignmentRouter = Router();

router.use(authenticate);
assignmentRouter.use(authenticate);

router.get('/', authorize('super_admin', 'it_admin', 'viewer', 'hr_admin'), DeviceController.list);
router.get('/:id', authorize('super_admin', 'it_admin', 'viewer', 'hr_admin'), DeviceController.get);
router.post('/', authorize('super_admin', 'it_admin'), validate(createDeviceValidator), DeviceController.create);
router.put('/:id', authorize('super_admin', 'it_admin'), validate(updateDeviceValidator), DeviceController.update);
router.delete('/:id', authorize('super_admin'), DeviceController.remove);

assignmentRouter.post('/', authorize('super_admin', 'it_admin'), validate(assignDeviceValidator), DeviceController.assign);
assignmentRouter.put('/:id/return', authorize('super_admin', 'it_admin'), DeviceController.returnAssignment);

export { assignmentRouter };
export default router;
