export const loginValidator = {
  email: { required: true, type: 'string', email: true },
  password: { required: true, type: 'string', min: 1 },
};

export const registerValidator = {
  email: { required: true, type: 'string', email: true },
  password: { required: true, type: 'string', min: 8 },
  role: { required: false, type: 'string', enum: ['super_admin', 'hr_admin', 'it_admin', 'viewer'] },
  siteId: { required: false, type: 'string' },
};
