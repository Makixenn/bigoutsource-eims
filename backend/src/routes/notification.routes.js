import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { requireSuperAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', NotificationController.list);
router.post('/trigger-cron', requireSuperAdmin(), NotificationController.triggerCron);
router.post('/trigger-birthdays', requireSuperAdmin(), NotificationController.triggerBirthdays);
router.post('/read-all', NotificationController.markAllRead);
router.delete('/', NotificationController.clearAll);
router.delete('/:id', NotificationController.clearSingle);

export default router;
