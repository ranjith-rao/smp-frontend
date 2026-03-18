/**
 * API Configuration
 * Centralized URL configuration for all API calls
+ */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: `${API_BASE_URL}/api/auth`,
    USERS: `${API_BASE_URL}/api/users`,
    PAGES: `${API_BASE_URL}/api/pages`,
    POSTS: `${API_BASE_URL}/api/posts`,
    CONTENT: `${API_BASE_URL}/api/content`,
    CHATS: `${API_BASE_URL}/api/chats`,
    ADMIN: `${API_BASE_URL}/api/admin`,
  },
};

export default API_CONFIG;
