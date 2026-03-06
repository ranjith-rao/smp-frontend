import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import { authService } from './authService';

const authHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const chatService = {
  async getConversations() {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch conversations');
    return data;
  },

  async searchChats(query) {
    const q = encodeURIComponent(query || '');
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/search?q=${q}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to search chats');
    return data;
  },

  async createDirectConversation(userId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to start chat');
    return data;
  },

  async createGroupConversation(name, memberIds) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ name, memberIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to create room');
    return data;
  },

  async getMessages(conversationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/messages`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch messages');
    return data;
  },

  async sendMessage(conversationId, payload) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to send message');
    return data;
  },

  async markRead(conversationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to mark read');
    return data;
  },
  async getUserPresence(userIds) {
    const ids = Array.isArray(userIds) ? userIds.join(',') : userIds;
    const res = await apiFetch(`${API_CONFIG.BASE_URL}/api/presence/status?userIds=${ids}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch presence');
    return data;
  },
};

export default chatService;
