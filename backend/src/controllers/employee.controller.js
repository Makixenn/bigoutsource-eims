import { EmployeeService } from '../services/employee.service.js';
import { success } from '../utils/apiResponse.js';
import { redactEmployeeForUser } from '../utils/employeeSecurity.js';
import { emitTableChange } from '../realtime/accessEvents.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { EmailService } from '../services/email.service.js';

export const EmployeeController = {
  async list(req, res, next) {
    try {
      const employees = await EmployeeService.list();
      return success(res, employees.map((employee) => redactEmployeeForUser(employee, req.user)));
    } catch (error) {
      return next(error);
    }
  },

  async exportData(req, res, next) {
    try {
      const employees = await EmployeeService.list();
      // Simple CSV building
      if (employees.length === 0) {
        return res.status(200).send('No data');
      }
      const headers = Object.keys(employees[0]).filter(k => typeof employees[0][k] !== 'object');
      const csvRows = [headers.join(',')];
      for (const emp of employees) {
        const values = headers.map(header => {
          const val = emp[header] === null || emp[header] === undefined ? '' : String(emp[header]);
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }
      const csvString = csvRows.join('\n');

      // Send email alert to users with export alerts capability
      const { RoleService } = await import('../services/role.service.js');
      const allUsers = await UserProfileModel.findAll({ status: 'active' });
      
      const alertRecipients = [];
      for (const u of allUsers) {
        const capabilities = await RoleService.resolveUserCapabilities(u);
        if (capabilities.includes('notifications.system.export_alerts')) {
          alertRecipients.push(u);
        }
      }
      for (const admin of alertRecipients) {
        if (admin.email) {
          const emailHtml = `
            <h3>Security Alert: Large Data Export</h3>
            <p>User <strong>${req.user.email}</strong> has just exported the entire employee directory to CSV.</p>
            <p>If this action was not authorized, please investigate immediately.</p>
          `;
          await EmailService.sendRawEmail(admin.email, 'Security Alert: Employee Directory Exported', emailHtml).catch(console.error);
        }
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees_export.csv"');
      return res.status(200).send(csvString);
    } catch (error) {
      return next(error);
    }
  },

  async summary(req, res, next) {
    try {
      return success(res, await EmployeeService.summary());
    } catch (error) {
      return next(error);
    }
  },

  async get(req, res, next) {
    try {
      const employee = await EmployeeService.get(req.params.id);
      return success(res, redactEmployeeForUser(employee, req.user));
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const employee = await EmployeeService.create(req.body, req.user, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      emitTableChange('employees', 'INSERT', { id: employee.id });
      return success(res, employee, 'Employee created', 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req, res, next) {
    try {
      console.log('--- Employee Update Request ---');
      console.log('ID:', req.params.id);
      console.log('Payload:', req.body);
      const employee = await EmployeeService.update(req.params.id, req.body, req.user, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      emitTableChange('employees', 'UPDATE', { id: employee.id });
      return success(res, employee, 'Employee updated');
    } catch (error) {
      console.error('Update Error:', error);
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await EmployeeService.remove(req.params.id, req.user, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      emitTableChange('employees', 'DELETE', { id: req.params.id });
      return success(res, null, 'Employee deleted');
    } catch (error) {
      return next(error);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const employee = await EmployeeService.update(
        req.params.id,
        { avatarUrl },
        req.user,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }
      );
      emitTableChange('employees', 'UPDATE', { id: employee.id });
      return success(res, redactEmployeeForUser(employee, req.user), 'Avatar uploaded successfully');
    } catch (error) {
      return next(error);
    }
  },

  async remindIT(req, res, next) {
    try {
      await EmployeeService.remindIT(req.params.id, req.user, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        note: req.body.note,
      });
      return success(res, null, 'Reminder sent to IT');
    } catch (error) {
      return next(error);
    }
  },

  async notifyIT(req, res, next) {
    try {
      const employee = await EmployeeService.notifyIT(req.params.id, req.user, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        note: req.body.note,
      });
      return success(res, redactEmployeeForUser(employee, req.user), 'IT notified');
    } catch (error) {
      return next(error);
    }
  },
};
