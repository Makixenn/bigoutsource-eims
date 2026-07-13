import { SettingsModel } from '../models/settings.model.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { auditActor } from '../utils/auditActor.js';

export const SettingsService = {
  get() {
    return SettingsModel.get();
  },

  async update(input, userActor, meta = {}) {
    const updated = await SettingsModel.update(input);
    
    const actor = auditActor(userActor);
    await AuditLogModel.create({
      ...actor,
      action: 'settings.updated',
      entityType: 'settings',
      entityId: 'global',
      entityLabel: 'Global Settings',
      details: { updates: Object.keys(input) },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return updated;
  },
};
