import { AppError } from '../utils/apiResponse.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.user?.roles || [];

    if (!roles.some((role) => allowedRoles.includes(role))) {
      return next(new AppError('Insufficient permissions', 403));
    }

    return next();
  };
}
