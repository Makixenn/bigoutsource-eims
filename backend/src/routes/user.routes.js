import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { changeUserPasswordValidator } from '../utils/auth.validator.js';

const router = Router();

router.get('/', UserController.list);
router.put('/:id', UserController.update);
router.put('/:id/password', validate(changeUserPasswordValidator), UserController.changeUserPassword);
router.put('/:id/capabilities', UserController.setCapabilities);
router.put('/:id/approve', UserController.approve);
router.put('/:id/disable', UserController.disable);
router.delete('/:id', UserController.remove);

export default router;
