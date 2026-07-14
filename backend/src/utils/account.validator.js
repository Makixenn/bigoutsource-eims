export const createAccountValidator = {
  name: { required: true, type: 'string', min: 2 },
  accountType: { required: true, type: 'string', enum: ['internal', 'external'] },
  departmentCode: {
    required: false,
    type: 'string',
    pattern: /^[A-Za-z]{1,4}$/,
    message: 'departmentCode must be 1-4 letters',
  },
};

export const updateAccountValidator = {
  name: { required: true, type: 'string', min: 2 },
  accountType: { required: false, type: 'string', enum: ['internal', 'external'] },
  departmentCode: {
    required: false,
    type: 'string',
    pattern: /^[A-Za-z]{1,4}$/,
    message: 'departmentCode must be 1-4 letters',
  },
};
