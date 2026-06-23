import { randomUUID } from 'node:crypto';
import { prisma } from '../config/db.js';
import { UserProfileModel } from '../models/userProfile.model.js';

function normalize(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail || 'System',
    userName: row.userName || '',
    userRole: row.userRole || '',
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    entityLabel: row.entityLabel || '',
    details: row.details || {},
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt ? row.createdAt.toISOString() : '',
  };
}

function isSystemActor(log) {
  return !log || log.userId === 'system' || log.userEmail === 'System';
}

function shouldUseProfileName(log) {
  return !isSystemActor(log) && (!log.userName || log.userName === log.userEmail);
}

async function enrichWithProfileName(log, cache = new Map()) {
  if (!shouldUseProfileName(log)) return log;

  const cacheKey = log.userId ? `id:${log.userId}` : `email:${log.userEmail}`;
  if (!cache.has(cacheKey)) {
    const fetchProfile = async () => {
      let profile = null;
      if (log.userId) profile = await UserProfileModel.findById(log.userId).catch(() => null);
      if (!profile && log.userEmail) profile = await UserProfileModel.findByEmail(log.userEmail).catch(() => null);
      return profile?.fullName || '';
    };
    cache.set(cacheKey, fetchProfile());
  }

  const fullName = await cache.get(cacheKey);
  return fullName ? { ...log, userName: fullName } : log;
}

export const AuditLogModel = {
  async create({
    userId,
    userEmail = 'System',
    userName = null,
    userRole = null,
    action,
    entityType,
    entityId = null,
    entityLabel = null,
    details = {},
    ipAddress = null,
    userAgent = null,
  }) {
    const enrichedLog = await enrichWithProfileName({
      userId,
      userEmail,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      entityLabel,
      details,
      ipAddress,
      userAgent,
    });

    const row = await prisma.auditLog.create({
      data: {
        id: enrichedLog.id || randomUUID(),
        userId: enrichedLog.userId || null,
        userEmail: enrichedLog.userEmail || 'System',
        userName: enrichedLog.userName || null,
        userRole: enrichedLog.userRole || null,
        action: enrichedLog.action,
        entityType: enrichedLog.entityType,
        entityId: enrichedLog.entityId || null,
        entityLabel: enrichedLog.entityLabel || null,
        details: enrichedLog.details || {},
        ipAddress: enrichedLog.ipAddress || null,
        userAgent: enrichedLog.userAgent || null,
      },
    });

    return enrichWithProfileName(normalize(row));
  },

  async findAll(filters = {}) {
    const limit = Math.min(Number(filters.limit || 500), 1000);
    const where = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.userEmail) where.userEmail = { contains: filters.userEmail, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entityType: { contains: filters.search, mode: 'insensitive' } },
        { userEmail: { contains: filters.search, mode: 'insensitive' } },
        { userName: { contains: filters.search, mode: 'insensitive' } },
        { userRole: { contains: filters.search, mode: 'insensitive' } },
        { entityLabel: { contains: filters.search, mode: 'insensitive' } },
        { userAgent: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const profileCache = new Map();
    const logs = await Promise.all(rows.map((row) => enrichWithProfileName(normalize(row), profileCache)));

    return logs.slice(0, limit);
  },

  async findById(id) {
    const row = await prisma.auditLog.findUnique({
      where: { id },
    });
    if (!row) return null;
    return enrichWithProfileName(normalize(row));
  },
};
