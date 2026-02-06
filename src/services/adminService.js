import { API_CONFIG } from '../config/api';
import { authService } from './authService';

/**
 * Admin API Service
 * Handles all admin-related API calls with proper authentication
 */

export const adminService = {
  // Get all users with pagination and search
  async getUsers(page = 1, limit = 10, search = '') {
    const token = authService.getToken();
    const params = new URLSearchParams({
      page,
      limit,
      search,
    });

    const response = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/all?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  },

  // Block or unblock a user
  async toggleBlockUser(userId) {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/${userId}/toggle-block`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  },

  // Get all posts (admin view)
  async getPosts(page = 1, limit = 10) {
    const token = authService.getToken();

    const response = await fetch(
      `${API_CONFIG.ENDPOINTS.POSTS}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  },

  // Get all reports
  async getReports(page = 1, limit = 10) {
    const token = authService.getToken();

    const response = await fetch(
      `${API_CONFIG.ENDPOINTS.ADMIN}/reports?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  },
};

export default adminService;
