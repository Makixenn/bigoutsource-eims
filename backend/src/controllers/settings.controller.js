import { SettingsService } from '../services/settings.service.js';
import { success } from '../utils/apiResponse.js';

export const SettingsController = {
  async get(req, res, next) {
    try {
      return success(res, await SettingsService.get());
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await SettingsService.update(req.body, req.user, meta), 'Settings saved');
    } catch (error) {
      return next(error);
    }
  },
};
