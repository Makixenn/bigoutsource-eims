import { apiRequest } from '@/src/lib/api';

export const employeeService = {
  list: (params) => apiRequest('/employees' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  summary: () => apiRequest('/employees/summary'),
  get: (id) => apiRequest(`/employees/${id}`),
  create: (input) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id) => apiRequest(`/employees/${id}`, { method: 'DELETE' }),
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest(`/employees/${id}/avatar`, { method: 'POST', body: formData });
  },
  remindIT: (id, note = '') => apiRequest(`/employees/${id}/remind-it`, { method: 'POST', body: JSON.stringify({ note }) }),
  notifyIT: (id, note = '') => apiRequest(`/employees/${id}/notify-it`, { method: 'POST', body: JSON.stringify({ note }) }),
};
