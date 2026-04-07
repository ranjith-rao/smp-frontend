import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import { authService } from './authService';

const authHeaders = () => {
  const token = authService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const storyService = {
  async getFeed() {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.STORIES}/feed`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to fetch stories');
    return data;
  },

  async createStory(payload) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.STORIES}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to create story');
    return data;
  },

  async markViewed(storyId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.STORIES}/${storyId}/view`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to mark story viewed');
    return data;
  },

  async deleteStory(storyId) {
    const res = await apiFetch(`${API_CONFIG.ENDPOINTS.STORIES}/${storyId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to delete story');
    return data;
  },
};

export default storyService;
