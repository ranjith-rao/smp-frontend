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

  async searchUsers(query = '') {
    const q = encodeURIComponent(query || '');
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/search?q=${q}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Unable to search users');
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

  async createGroupConversation(name, memberIds, avatarUrl = null) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ name, memberIds, avatarUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to create room');
    return data;
  },

  async getGroupMembers(conversationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/members`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch members');
    return data;
  },

  async addGroupMembers(conversationId, memberIds) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ memberIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to add members');
    return data;
  },

  async removeGroupMember(conversationId, memberId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/members/${memberId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to remove member');
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

  async deleteMessage(conversationId, messageId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to delete message');
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

  async updateGroupName(conversationId, groupName) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ groupName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to update group name');
    return data;
  },

  async updateGroupPhoto(conversationId, photoUrl) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/photo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({ photoUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to update group photo');
    return data;
  },

  async deleteConversation(conversationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to delete conversation');
    return data;
  },

  async exitGroup(conversationId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.CHATS}/conversations/${conversationId}/exit`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to exit group');
    return data;
  },
};

export default chatService;
