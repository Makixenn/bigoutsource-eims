import { RoleService } from '../services/role.service.js';
import { success } from '../utils/apiResponse.js';

export const RoleController = {
  async list(req, res, next) {
    try {
      return success(res, await RoleService.list());
    } catch (error) {
      return next(error);
    }
  },

  async catalog(req, res, next) {
    try {
      return success(res, RoleService.catalog());
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await RoleService.create(req.body, req.user, meta), 'Role created', 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      return success(res, await RoleService.update(req.params.slug, req.body, req.user, meta), 'Role updated');
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const meta = { ipAddress: req.ip, userAgent: req.get('user-agent') };
      await RoleService.remove(req.params.slug, req.user, meta);
      return success(res, null, 'Role deleted');
    } catch (error) {
      return next(error);
    }
  },
};
