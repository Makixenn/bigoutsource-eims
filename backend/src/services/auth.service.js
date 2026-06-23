import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import { RoleService } from '../services/role.service.js';
import { publicUserPayload } from '../utils/publicUser.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function publicUser(profile) {
  const capabilities = Array.isArray(profile.capabilities)
    ? profile.capabilities
    : await RoleService.resolveUserCapabilities(profile);

  return publicUserPayload(profile, capabilities);
}

async function assertActiveProfile(userId) {
  const profile = await prisma.userProfile.findUnique({ where: { id: userId } });

  if (!profile) {
    throw new AppError('Account profile not found. Please contact the Super Admin.', 403);
  }

  if (profile.status === 'pending') {
    throw new AppError('Your account is pending Super Admin approval.', 403);
  }

  if (profile.status === 'disabled') {
    throw new AppError('Your account has been disabled. Please contact the Super Admin.', 403);
  }

  return profile;
}

export const AuthService = {
  async register({ email, password, fullName, department = 'Unassigned', site = 'HQ' }) {
    const normalizedEmail = normalizeEmail(email);
    const existingProfile = await prisma.userProfile.findUnique({ where: { email: normalizedEmail } });
    if (existingProfile) throw new AppError('An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const profile = await prisma.userProfile.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role: 'viewer',
        status: 'pending',
        department,
        site,
      },
    });

    return {
      user: await publicUser(profile),
      message: 'Account created and pending Super Admin approval.',
    };
  },

  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const profile = await prisma.userProfile.findUnique({ where: { email: normalizedEmail } });
    if (!profile) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, profile.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    await assertActiveProfile(profile.id);

    const token = jwt.sign({ id: profile.id, email: profile.email }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    return {
      token,
      user: await publicUser(profile),
    };
  },

  async me(user) {
    return publicUser(user);
  },

  async changePassword(user, { currentPassword, newPassword }) {
    const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
    if (!profile) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPassword, profile.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return { changed: true };
  },

  async bootstrapSuperAdmin() {
    const email = normalizeEmail(env.seedSuperAdmin.email);
    const password = env.seedSuperAdmin.password;

    if (!email || !password) return;

    let profile = await prisma.userProfile.findUnique({ where: { email } });
    
    const passwordHash = await bcrypt.hash(password, 10);

    if (profile) {
      if (profile.role !== 'super_admin' || profile.status !== 'active') {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: {
            role: 'super_admin',
            status: 'active',
            passwordHash,
            approvedAt: profile.approvedAt || new Date(),
          },
        });
      } else {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: { passwordHash },
        });
      }
      return;
    }

    await prisma.userProfile.create({
      data: {
        email,
        passwordHash,
        fullName: env.seedSuperAdmin.fullName,
        role: 'super_admin',
        status: 'active',
        department: env.seedSuperAdmin.department,
        site: env.seedSuperAdmin.site,
        approvedAt: new Date(),
      },
    });
  },
};
