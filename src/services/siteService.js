import { apiRequest } from './api';

export const siteService = {
  list: () => apiRequest('/sites'),
  create: (input) => apiRequest('/sites', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => apiRequest(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id) => apiRequest(`/sites/${id}`, { method: 'DELETE' }),
};
