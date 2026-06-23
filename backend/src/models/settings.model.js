import { prisma } from '../config/db.js';

const SETTINGS_ID = 'global';

const DEFAULT_SETTINGS = {
  companyName: 'BigOutsource',
  notifyRegistrationAttempts: true,
  notifySystemAlerts: true,
};

function normalize(row) {
  if (!row) return DEFAULT_SETTINGS;

  return {
    companyName: row.companyName || DEFAULT_SETTINGS.companyName,
    notifyRegistrationAttempts: row.notifyRegistrationAttempts ?? DEFAULT_SETTINGS.notifyRegistrationAttempts,
    notifySystemAlerts: row.notifySystemAlerts ?? DEFAULT_SETTINGS.notifySystemAlerts,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

export const SettingsModel = {
  async get() {
    const row = await prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    return normalize(row);
  },

  async update(data) {
    const updateData = {};
    if (data.companyName !== undefined) updateData.companyName = String(data.companyName).trim() || DEFAULT_SETTINGS.companyName;
    if (data.notifyRegistrationAttempts !== undefined) updateData.notifyRegistrationAttempts = Boolean(data.notifyRegistrationAttempts);
    if (data.notifySystemAlerts !== undefined) updateData.notifySystemAlerts = Boolean(data.notifySystemAlerts);

    const row = await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...updateData,
      },
      update: updateData,
    });

    return normalize(row);
  },
};
