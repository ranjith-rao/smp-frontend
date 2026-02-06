/**
 * API Configuration
 * Centralized URL configuration for all API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTH: `${API_BASE_URL}/api/auth`,
    USERS: `${API_BASE_URL}/api/users`,
    POSTS: `${API_BASE_URL}/api/posts`,
    ADMIN: `${API_BASE_URL}/api/admin`,
  },
};

export default API_CONFIG;
