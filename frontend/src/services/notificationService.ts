import { BaseService } from './BaseService';
import { apiRequest } from '../lib/api';

class NotificationService extends BaseService<any> {
  constructor() {
    super('/notifications');
  }

  async markAllRead() {
    return apiRequest(`${this.endpoint}/read-all`, { method: 'POST' });
  }

  async clearAll() {
    return apiRequest(this.endpoint, { method: 'DELETE' });
  }

  async clearSingle(id: string) {
    return apiRequest(`${this.endpoint}/${id}`, { method: 'DELETE' });
  }
}

export const notificationService = new NotificationService();
