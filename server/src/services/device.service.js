import { DeviceModel } from '../models/device.model.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { AppError } from '../utils/apiResponse.js';

export const DeviceService = {
  list() {
    return DeviceModel.findAll();
  },

  async get(id) {
    const device = await DeviceModel.findById(id);
    if (!device) throw new AppError('Device not found', 404);
    return device;
  },

  async create(data, user, meta = {}) {
    const device = await DeviceModel.create(data, user.id);
    await AuditLogModel.create({
      userId: user.id,
      action: 'device.create',
      entityType: 'devices',
      entityId: device.id,
      details: { assetTag: device.assetTag },
      ipAddress: meta.ipAddress,
    });
    return device;
  },

  async update(id, data, user, meta = {}) {
    const device = await DeviceModel.update(id, data, user.id);
    if (!device) throw new AppError('Device not found', 404);
    await AuditLogModel.create({
      userId: user.id,
      action: 'device.update',
      entityType: 'devices',
      entityId: id,
      ipAddress: meta.ipAddress,
    });
    return device;
  },

  async remove(id, user, meta = {}) {
    const removed = await DeviceModel.remove(id);
    if (!removed) throw new AppError('Device not found', 404);
    await AuditLogModel.create({
      userId: user.id,
      action: 'device.delete',
      entityType: 'devices',
      entityId: id,
      ipAddress: meta.ipAddress,
    });
  },

  async assign(data, user, meta = {}) {
    const assignment = await DeviceModel.assign(data, user.id);
    await AuditLogModel.create({
      userId: user.id,
      action: 'device.assign',
      entityType: 'device_assignments',
      entityId: assignment.id,
      details: { deviceId: data.deviceId, employeeId: data.employeeId },
      ipAddress: meta.ipAddress,
    });
    return assignment;
  },

  async returnAssignment(id, user, meta = {}) {
    const assignment = await DeviceModel.returnAssignment(id, user.id);
    if (!assignment) throw new AppError('Active assignment not found', 404);
    await AuditLogModel.create({
      userId: user.id,
      action: 'device.return',
      entityType: 'device_assignments',
      entityId: id,
      ipAddress: meta.ipAddress,
    });
    return assignment;
  },
};
