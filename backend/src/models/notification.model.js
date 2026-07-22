import { prisma } from '../config/db.js';
import { emitTableChange } from '../realtime/accessEvents.js';

function normalize(row) {
  if (!row) return null;

  return {
    id: row.id,
    recipientId: row.recipientId,
    type: row.type || '',
    actorId: row.actorId || null,
    actorName: row.actorName || '',
    actorRole: row.actorRole || '',
    message: row.message || '',
    entityType: row.entityType || '',
    entityId: row.entityId || '',
    entityLabel: row.entityLabel || '',
    actionUrl: row.actionUrl || '',
    details: row.details || {},
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : '',
  };
}

export const NotificationModel = {
  async findForRecipient(recipientId, { limit = 30 } = {}) {
    const rows = await prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 30,
    });
    return rows.map(normalize);
  },

  async createMany(notifications) {
    if (!notifications.length) return [];

    const payloads = notifications.map(data => ({
      recipientId: data.recipientId,
      type: data.type,
      actorId: data.actorId || null,
      actorName: data.actorName || null,
      actorRole: data.actorRole || null,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      entityLabel: data.entityLabel || null,
      actionUrl: data.actionUrl || null,
      details: data.details || {},
    }));

    await prisma.notification.createMany({
      data: payloads,
    });
    
    // In Prisma, createMany doesn't return the inserted rows.
    // Given the previous usage, let's just return an empty array or we would have to find them.
    emitTableChange('notifications', 'INSERT');
    return [];
  },

  async markAllReadForRecipient(recipientId) {
    const now = new Date();
    await prisma.notification.updateMany({
      where: {
        recipientId,
        readAt: null,
      },
      data: { readAt: now },
    });
    // Returning empty since previous mapped the patched rows but typically not strictly required for a markAllRead.
    emitTableChange('notifications', 'UPDATE');
    return [];
  },

  async clearAllForRecipient(recipientId) {
    const notifications = await prisma.notification.findMany({ where: { recipientId } });
    const toDelete = notifications.filter(n => {
      const parsed = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
      if (parsed?.isArchiveNotification && parsed?.archiveStatus !== 'complete') return false;
      if (parsed?.missingFields && !parsed?.isComplete) return false;
      return true;
    }).map(n => n.id);

    if (toDelete.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: toDelete } },
      });
      emitTableChange('notifications', 'DELETE');
    }
    return [];
  },

  async clearSingleForRecipient(id, recipientId) {
    const n = await prisma.notification.findFirst({ where: { id, recipientId } });
    if (!n) return [];

    const parsed = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
    if (parsed?.isArchiveNotification && parsed?.archiveStatus !== 'complete') return [];
    if (parsed?.missingFields && !parsed?.isComplete) return [];

    await prisma.notification.deleteMany({
      where: { id, recipientId },
    });
    emitTableChange('notifications', 'DELETE');
    return [];
  },

  async findById(id) {
    const row = await prisma.notification.findUnique({
      where: { id },
    });
    return normalize(row);
  },

  async clearGlobalByEntity(entityType, entityId, type, missingFields) {
    const notifications = await prisma.notification.findMany({
      where: { entityType, entityId, type },
    });

    const toDelete = notifications.filter((n) => {
      // Prisma JSON fields are parsed as objects/arrays automatically if supported, 
      // or we might need to check the raw value. We use normalize() normally.
      const parsed = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
      const mFields = parsed?.missingFields;
      if (!missingFields) return !mFields;
      return mFields === missingFields;
    }).map((n) => n.id);

    if (toDelete.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: toDelete } },
      });
      emitTableChange('notifications', 'DELETE');
    }
    return [];
  },

  async markAsCompleteGlobalByEntity(entityType, entityId, type, missingFields) {
    const notifications = await prisma.notification.findMany({
      where: { entityType, entityId, type },
    });

    for (const n of notifications) {
      const parsed = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
      const mFields = parsed?.missingFields;
      if (mFields === missingFields && !parsed?.isComplete) {
        await prisma.notification.update({
          where: { id: n.id },
          data: {
            details: {
              ...parsed,
              isComplete: true,
            },
          },
        });
      }
    }
    if (notifications.length > 0) {
      emitTableChange('notifications', 'UPDATE');
    }
    return [];
  },
};
