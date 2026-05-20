export const createEmployeeValidator = {
  employeeNumber: { required: true, type: 'string' },
  fullName: { required: true, type: 'string' },
  boEmail: { required: false, type: 'string', email: true },
  phone: { required: false, type: 'string' },
  address: { required: false, type: 'string' },
  accountAssignment: { required: false, type: 'string' },
  lmsAccount: { required: false, type: 'string' },
  siteId: { required: false, type: 'string' },
  status: { required: false, type: 'string', enum: ['active', 'inactive', 'archive'] },
};

export const updateEmployeeValidator = {
  employeeNumber: { required: false, type: 'string' },
  fullName: { required: false, type: 'string' },
  boEmail: { required: false, type: 'string', email: true },
  phone: { required: false, type: 'string' },
  address: { required: false, type: 'string' },
  accountAssignment: { required: false, type: 'string' },
  lmsAccount: { required: false, type: 'string' },
  siteId: { required: false, type: 'string' },
  status: { required: false, type: 'string', enum: ['active', 'inactive', 'archive'] },
};
