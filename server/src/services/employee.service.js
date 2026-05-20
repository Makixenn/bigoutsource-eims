import { EmployeeModel } from '../models/employee.model.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { AppError } from '../utils/apiResponse.js';

export const EmployeeService = {
  list() {
    return EmployeeModel.findAll();
  },

  async get(id) {
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  },

  async create(data, user, meta = {}) {
    const employee = await EmployeeModel.create(data, user.id);
    await AuditLogModel.create({
      userId: user.id,
      action: 'employee.create',
      entityType: 'employees',
      entityId: employee.id,
      details: { employeeNumber: employee.employeeNumber },
      ipAddress: meta.ipAddress,
    });
    return employee;
  },

  async update(id, data, user, meta = {}) {
    const employee = await EmployeeModel.update(id, data, user.id);
    if (!employee) throw new AppError('Employee not found', 404);
    await AuditLogModel.create({
      userId: user.id,
      action: 'employee.update',
      entityType: 'employees',
      entityId: id,
      ipAddress: meta.ipAddress,
    });
    return employee;
  },

  async remove(id, user, meta = {}) {
    const removed = await EmployeeModel.remove(id);
    if (!removed) throw new AppError('Employee not found', 404);
    await AuditLogModel.create({
      userId: user.id,
      action: 'employee.delete',
      entityType: 'employees',
      entityId: id,
      ipAddress: meta.ipAddress,
    });
  },
};
