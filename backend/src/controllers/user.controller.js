import { UserService } from '../services/user.service.js';
import { success } from '../utils/apiResponse.js';

export const UserController = {
  async list(req, res, next) {
    try {
      return success(res, await UserService.list(req.query));
    } catch (error) {
      return next(error);
    }
  },

  async approve(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await UserService.approve(req.params.id, req.user, meta), 'User approved');
    } catch (error) {
      return next(error);
    }
  },

  async disable(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await UserService.disable(req.params.id, req.user, meta), 'User disabled');
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await UserService.update(req.params.id, req.body, req.user, meta), 'User updated');
    } catch (error) {
      return next(error);
    }
  },

  async changeUserPassword(req, res, next) {
    try {
      if (!req.body.newPassword) {
        const { AppError } = await import('../utils/apiResponse.js');
        throw new AppError('Password is required', 400);
      }
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await UserService.updatePassword(req.params.id, req.body.newPassword, req.user, meta), 'Password updated');
    } catch (error) {
      return next(error);
    }
  },

  async setCapabilities(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await UserService.setCapabilities(req.params.id, req.body.capabilities, req.user, meta), 'Capabilities updated');
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      return success(res, await UserService.remove(req.params.id), 'User deleted');
    } catch (error) {
      return next(error);
    }
  },
};
