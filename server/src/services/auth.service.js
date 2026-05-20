import { transaction } from '../config/db.js';
import { UserModel } from '../models/user.model.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { comparePassword, hashPassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/generateToken.js';
import { AppError } from '../utils/apiResponse.js';

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    site: user.site,
    siteId: user.siteId,
    roles: user.roles,
    role: user.roles[0] || 'viewer',
  };
}

export const AuthService = {
  async login({ email, password }, meta = {}) {
    const user = await UserModel.findByEmail(email);

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('Account is disabled', 403);
    }

    const token = generateToken({ sub: user.id, roles: user.roles });

    await AuditLogModel.create({
      userId: user.id,
      action: 'auth.login',
      entityType: 'users',
      entityId: user.id,
      ipAddress: meta.ipAddress,
    });

    return { token, user: publicUser(user) };
  },

  async register({ email, password, role = 'viewer', siteId = null }, actor, meta = {}) {
    if (!actor.roles.includes('super_admin')) {
      throw new AppError('Only Super Admin can register users', 403);
    }

    const existing = await UserModel.findByEmail(email);
    if (existing) throw new AppError('Email is already registered', 409);

    const passwordHash = await hashPassword(password);
    const user = await transaction((client) => UserModel.create({ email, passwordHash, siteId, role }, client));

    await AuditLogModel.create({
      userId: actor.id,
      action: 'auth.register',
      entityType: 'users',
      entityId: user.id,
      details: { email, role },
      ipAddress: meta.ipAddress,
    });

    return publicUser(user);
  },

  me(user) {
    return publicUser(user);
  },
};
