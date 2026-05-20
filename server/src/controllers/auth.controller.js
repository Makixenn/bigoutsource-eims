import { AuthService } from '../services/auth.service.js';
import { success } from '../utils/apiResponse.js';

export const AuthController = {
  async login(req, res, next) {
    try {
      const data = await AuthService.login(req.body, { ipAddress: req.ip });
      return success(res, data, 'Logged in');
    } catch (error) {
      return next(error);
    }
  },

  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body, req.user, { ipAddress: req.ip });
      return success(res, user, 'User registered', 201);
    } catch (error) {
      return next(error);
    }
  },

  async me(req, res, next) {
    try {
      return success(res, AuthService.me(req.user));
    } catch (error) {
      return next(error);
    }
  },

  async logout(req, res) {
    return success(res, null, 'Logged out');
  },
};
