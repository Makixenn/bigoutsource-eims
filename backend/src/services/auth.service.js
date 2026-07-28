import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as otplib from 'otplib';
import crypto from 'crypto';
const { generateSecret, generateURI, verifySync } = otplib;
import qrcode from 'qrcode';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import { RoleService } from '../services/role.service.js';
import { publicUserPayload } from '../utils/publicUser.js';
import { EmailService } from './email.service.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { auditActor } from '../utils/auditActor.js';

function generateRandomCode() {
  // Use a cryptographically secure random number generator instead of Math.random
  return crypto.randomInt(100000, 1000000).toString();
}


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
  async checkEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const existingProfile = await prisma.userProfile.findUnique({ where: { email: normalizedEmail } });
    return { exists: !!existingProfile };
  },

  async register({ email, password, fullName, department = 'Unassigned', site = 'HQ' }) {
    const normalizedEmail = normalizeEmail(email);

    if (
      !normalizedEmail.endsWith('@bigoutsource.com') &&
      !normalizedEmail.endsWith('@outlook.com') &&
      !normalizedEmail.endsWith('@bigoutsource.ph') &&
      !normalizedEmail.endsWith('@outlook.ph')
    ) {
      throw new AppError('Only @bigoutsource.com, @outlook.com, @bigoutsource.ph, and @outlook.ph email addresses are allowed.', 400);
    }

    const existingProfile = await prisma.userProfile.findUnique({ where: { email: normalizedEmail } });
    if (existingProfile) throw new AppError('An account with this email already exists', 409);

    // Look up the matching employee to find their EMAIL DEFAULT PASSWORD (emailPassword)
    const matchingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { bigoutsourceEmail: { equals: normalizedEmail, mode: 'insensitive' } },
          { outlookEmail: { equals: normalizedEmail, mode: 'insensitive' } }
        ]
      }
    });

    let initialPassword = password;
    if (matchingEmployee && matchingEmployee.emailPassword) {
      initialPassword = matchingEmployee.emailPassword;
    }

    if (!initialPassword) {
      // If no password is provided and no default email password is found, generate a secure random fallback password
      initialPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
    }

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    const passwordSetupToken = crypto.randomBytes(32).toString('hex');

    const profile = await prisma.userProfile.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role: 'viewer',
        status: 'active',
        approvedAt: new Date(),
        department,
        site,
        passwordSetupToken,
      },
    });

    // Send the password setup email asynchronously
    await EmailService.sendPasswordSetupEmail(profile.email, passwordSetupToken);

    return {
      user: await publicUser(profile),
      message: 'Account created successfully.',
    };
  },

  async verifySetupPasswordToken(token) {
    if (!token) return { valid: false };
    const profile = await prisma.userProfile.findUnique({
      where: { passwordSetupToken: token }
    });
    return { valid: !!profile };
  },

  async setupPassword({ token, password }) {
    if (!token) throw new AppError('Token is required', 400);

    const profile = await prisma.userProfile.findUnique({
      where: { passwordSetupToken: token }
    });

    if (!profile) {
      throw new AppError('Invalid or expired password setup link', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Save password and consume the token immediately
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        passwordHash,
        passwordSetupToken: null,
      }
    });

    // Generate and send MFA code
    const code = generateRandomCode();
    const codeHash = await bcrypt.hash(code, 10);

    await EmailService.sendMfaOtpEmail(profile.email, code);

    const mfaToken = jwt.sign({ id: profile.id, email: profile.email, mfaPending: true, codeHash }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    return { requiresMfa: true, mfaToken };
  },

  async forgotPassword({ email }) {
    const normalizedEmail = normalizeEmail(email);

    if (
      !normalizedEmail.endsWith('@bigoutsource.com') &&
      !normalizedEmail.endsWith('@outlook.com') &&
      !normalizedEmail.endsWith('@bigoutsource.ph') &&
      !normalizedEmail.endsWith('@outlook.ph')
    ) {
      throw new AppError('Only @bigoutsource.com, @outlook.com, @bigoutsource.ph, and @outlook.ph email addresses are allowed.', 400);
    }

    const profile = await prisma.userProfile.findUnique({ where: { email: normalizedEmail } });

    if (!profile) {
      throw new AppError('No registered account found with this email address.', 404);
    }

    if (profile.status === 'pending') {
      throw new AppError('Your account is pending administrator approval.', 403);
    }

    if (profile.status === 'disabled') {
      throw new AppError('Your account has been disabled. Please contact your administrator.', 403);
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    await EmailService.sendPasswordResetEmail(profile.email, resetPasswordToken);

    return {
      message: 'Password reset instructions have been sent to your email.',
    };
  },

  async verifyResetPasswordToken(token) {
    if (!token) return { valid: false, message: 'Token is required' };

    const profile = await prisma.userProfile.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!profile) {
      return { valid: false, message: 'Invalid or expired password reset link' };
    }

    if (!profile.resetPasswordExpires || new Date(profile.resetPasswordExpires) < new Date()) {
      return { valid: false, message: 'Password reset link has expired' };
    }

    return { valid: true };
  },

  async resetPassword({ token, password }) {
    if (!token) throw new AppError('Token is required', 400);

    const profile = await prisma.userProfile.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!profile || !profile.resetPasswordExpires || new Date(profile.resetPasswordExpires) < new Date()) {
      throw new AppError('Invalid or expired password reset link', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await AuditLogModel.create({
      action: 'user.password_reset',
      entityType: 'users',
      entityId: profile.id,
      entityLabel: profile.fullName || profile.email,
      details: { message: 'User reset their password via email link.' },
      userEmail: profile.email,
      userId: profile.id,
    });

    const code = generateRandomCode();
    const codeHash = await bcrypt.hash(code, 10);

    await EmailService.sendMfaOtpEmail(profile.email, code);

    const mfaToken = jwt.sign({ id: profile.id, email: profile.email, mfaPending: true, codeHash }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    return { requiresMfa: true, mfaToken };
  },

  async login({ email, password, trustedDeviceToken }) {
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



    if (trustedDeviceToken) {
      try {
        const decoded = jwt.verify(trustedDeviceToken, process.env.JWT_SECRET);
        if (decoded.id === profile.id && decoded.mfaTrusted) {
          const sessionId = crypto.randomUUID();
          await prisma.userProfile.update({
            where: { id: profile.id },
            data: { currentSessionId: sessionId },
          });
          const token = jwt.sign({ id: profile.id, email: profile.email, sessionId }, process.env.JWT_SECRET, {
            expiresIn: '30m',
          });
          const refreshToken = jwt.sign({ id: profile.id, type: 'refresh', sessionId }, process.env.JWT_SECRET, {
            expiresIn: '12h',
          });
          return { token, refreshToken, user: await publicUser(profile), sessionId };
        }
      } catch (err) {
        // Ignore invalid/expired trusted token
      }
    }

    const code = generateRandomCode();
    const codeHash = await bcrypt.hash(code, 10);

    await EmailService.sendMfaOtpEmail(profile.email, code);

    const mfaToken = jwt.sign({ id: profile.id, email: profile.email, mfaPending: true, codeHash }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    return { requiresMfa: true, mfaToken };
  },

  async loginMfa({ mfaToken, code }) {
    if (!code) {
      throw new AppError('MFA code is required', 400);
    }
    
    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired MFA token', 401);
    }

    if (!decoded.mfaPending) {
      throw new AppError('Invalid MFA token', 401);
    }

    const profile = await assertActiveProfile(decoded.id);

    if (!decoded.codeHash) {
      throw new AppError('Invalid MFA token format', 400);
    }

    const trimmedCode = String(code).trim();
    const isMatch = await bcrypt.compare(trimmedCode, decoded.codeHash);
    if (!isMatch) {
      throw new AppError('Invalid MFA code', 401);
    }

    const sessionId = crypto.randomUUID();
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { currentSessionId: sessionId },
    });

    const token = jwt.sign({ id: profile.id, email: profile.email, sessionId }, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    const refreshToken = jwt.sign({ id: profile.id, type: 'refresh', sessionId }, process.env.JWT_SECRET, {
      expiresIn: '12h',
    });

    const trustedDeviceToken = jwt.sign({ id: profile.id, mfaTrusted: true }, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    return {
      token,
      refreshToken,
      trustedDeviceToken,
      user: await publicUser(profile),
      sessionId,
    };
  },

  async resendLoginMfa({ mfaToken }) {
    let decoded;
    try {
      // Ignore expiration on the resend so they can actually click the button after 5 mins,
      // but we will manually verify it hasn't been too long since they typed their password.
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      throw new AppError('Invalid MFA token. Please log in again.', 401);
    }

    if (!decoded.mfaPending) {
      throw new AppError('Invalid MFA token', 401);
    }

    // Prevent resending if the original login attempt is older than 15 minutes
    const tokenAgeMs = Date.now() - (decoded.iat * 1000);
    if (tokenAgeMs > 15 * 60 * 1000) {
      throw new AppError('Session expired. Please log in again with your password.', 401);
    }

    const profile = await assertActiveProfile(decoded.id);

    const code = generateRandomCode();
    const codeHash = await bcrypt.hash(code, 10);

    await EmailService.sendMfaOtpEmail(profile.email, code);

    const newMfaToken = jwt.sign({ id: profile.id, email: profile.email, mfaPending: true, codeHash }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    return { mfaToken: newMfaToken };
  },

  async me(user) {
    return publicUser(user);
  },

  async refreshSession({ refreshToken }) {
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const profile = await assertActiveProfile(decoded.id);

    const token = jwt.sign({ id: profile.id, email: profile.email, sessionId: decoded.sessionId }, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    return { token, user: await publicUser(profile) };
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

    const actor = auditActor(user);
    await AuditLogModel.create({
      ...actor,
      action: 'user.password_changed',
      entityType: 'users',
      entityId: user.id,
      entityLabel: user.fullName || user.email,
      details: { message: 'User changed their password.' },
      ipAddress: user.ipAddress, // Note: The meta might need to be passed if we want IP, let's assume not available in this scope easily without modifying controller
      userAgent: user.userAgent,
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
