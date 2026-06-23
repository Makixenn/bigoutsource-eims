import { randomUUID } from 'node:crypto';
import { prisma } from '../config/db.js';

function normalize(row) {
  if (!row) return null;

  return {
    id: row.id,
    importBatchId: row.importBatchId,
    sourceSheet: row.sourceSheet,
    sourceRow: row.sourceRow,
    rawData: row.rawData || {},
    normalizedData: row.normalizedData || {},
    issues: row.issues || [],
    status: row.status,
    duplicateKey: row.duplicateKey,
    resolution: row.resolution,
    createdBy: row.createdById,
    createdAt: row.createdAt ? row.createdAt.toISOString() : '',
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : '',
  };
}

export const EmployeeImportModel = {
  async insertMany(rows) {
    if (!rows.length) return [];

    const payloads = rows.map(row => ({
      id: row.id || randomUUID(),
      importBatchId: row.importBatchId,
      sourceSheet: row.sourceSheet || 'IT Master Tracker',
      sourceRow: row.sourceRow || null,
      rawData: row.rawData || {},
      normalizedData: row.normalizedData || {},
      issues: row.issues || [],
      status: row.status || 'issue',
      duplicateKey: row.duplicateKey || null,
      resolution: row.resolution || null,
      createdById: row.createdBy || null,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    }));

    await prisma.employeeImportStaging.createMany({
      data: payloads,
    });
    
    // We cannot easily map returned since createMany does not return records.
    return [];
  },

  async findAll(filters = {}) {
    const where = {};
    if (filters.importBatchId) where.importBatchId = filters.importBatchId;
    if (filters.status) where.status = filters.status;

    const rows = await prisma.employeeImportStaging.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(filters.limit || 1000), 2000),
    });
    return rows.map(normalize);
  },

  async findById(id) {
    const row = await prisma.employeeImportStaging.findUnique({
      where: { id },
    });
    return normalize(row);
  },

  async countPendingImports() {
    return prisma.employeeImportStaging.count({
      where: {
        status: { in: ['issue', 'ready'] },
      },
    });
  },

  async update(id, data) {
    const updateData = {};
    if (data.importBatchId !== undefined) updateData.importBatchId = data.importBatchId;
    if (data.sourceSheet !== undefined) updateData.sourceSheet = data.sourceSheet;
    if (data.sourceRow !== undefined) updateData.sourceRow = data.sourceRow;
    if (data.rawData !== undefined) updateData.rawData = data.rawData;
    if (data.normalizedData !== undefined) updateData.normalizedData = data.normalizedData;
    if (data.issues !== undefined) updateData.issues = data.issues;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.duplicateKey !== undefined) updateData.duplicateKey = data.duplicateKey;
    if (data.resolution !== undefined) updateData.resolution = data.resolution;
    if (data.createdBy !== undefined) updateData.createdById = data.createdBy;

    const row = await prisma.employeeImportStaging.update({
      where: { id },
      data: updateData,
    });
    return normalize(row);
  },

  async removeByIds(ids = []) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return [];

    await prisma.employeeImportStaging.deleteMany({
      where: { id: { in: uniqueIds } },
    });
    return [];
  },

  async remove(id) {
    await prisma.employeeImportStaging.delete({
      where: { id },
    });
    return [];
  },
};
