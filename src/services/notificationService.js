import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import { authService } from './authService';

const authHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationService = {
  async getNotifications({ limit = 20, cursor = null } = {}) {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', String(cursor));

    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?${params.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch notifications');
    return data;
  },

  async getUnreadCount() {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/unread-count`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch unread count');
    return data;
  },

  async markAsRead(notificationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to mark notification as read');
    return data;
  },

  async markAllAsRead() {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.NOTIFICATIONS}/read-all`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to mark all notifications as read');
    return data;
  },
};

export default notificationService;
