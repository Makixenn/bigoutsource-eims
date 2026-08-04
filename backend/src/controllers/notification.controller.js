import { NotificationService } from '../services/notification.service.js';
import { CronService } from '../services/cron.service.js';
import { success } from '../utils/apiResponse.js';

export const NotificationController = {
  async triggerCron(req, res, next) {
    try {
      await CronService.checkEvaluations({ todayOnly: false, force: true });
      return success(res, { success: true }, 'Triggered evaluation checks');
    } catch (error) {
      return next(error);
    }
  },

  async triggerBirthdays(req, res, next) {
    try {
      const { processDailyBirthdays } = await import('../utils/scheduler.js');
      await processDailyBirthdays();
      return success(res, { success: true }, 'Triggered birthday checks');
    } catch (error) {
      return next(error);
    }
  },
  async list(req, res, next) {
    try {
      const limit = Number.parseInt(req.query.limit, 10) || 30;
      return success(res, await NotificationService.listForUser(req.user, { limit }));
    } catch (error) {
      return next(error);
    }
  },

  async markAllRead(req, res, next) {
    try {
      return success(res, await NotificationService.markAllReadForUser(req.user), 'Notifications marked as read');
    } catch (error) {
      return next(error);
    }
  },

  async clearAll(req, res, next) {
    try {
      return success(res, await NotificationService.clearAllForUser(req.user), 'Notifications cleared');
    } catch (error) {
      return next(error);
    }
  },

  async clearSingle(req, res, next) {
    try {
      return success(res, await NotificationService.clearSingleForUser(req.params.id, req.user), 'Notification cleared');
    } catch (error) {
      return next(error);
    }
  },
};
