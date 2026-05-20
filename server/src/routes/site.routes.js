import { Router } from 'express';
import { SiteController } from '../controllers/site.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createSiteValidator, updateSiteValidator } from '../validators/site.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_admin', 'it_admin', 'viewer'), SiteController.list);
router.post('/', authorize('super_admin'), validate(createSiteValidator), SiteController.create);
router.put('/:id', authorize('super_admin'), validate(updateSiteValidator), SiteController.update);
router.delete('/:id', authorize('super_admin'), SiteController.remove);

export default router;
