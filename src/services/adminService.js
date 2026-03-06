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

  // Soft delete a user
  async deleteUser(userId) {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    return response.json();
  },

  // Create a new user (admin)
  async createUser(userData) {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.USERS}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
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

  // Get all contact queries
  async getQueries() {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.CONTENT}/queries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch queries');
    }

    return response.json();
  },

  // Delete a query by id
  async deleteQuery(queryId) {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.CONTENT}/queries/${queryId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete query');
    }

    return response.json();
  },

  // Fetch landing page content settings
  async getLandingContent() {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.CONTENT}/landing-page`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch landing content');
    }

    return response.json();
  },

  // Update landing page content settings
  async updateLandingContent(settings) {
    const token = authService.getToken();

    const response = await fetch(`${API_CONFIG.ENDPOINTS.CONTENT}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update landing content');
    }

    return response.json();
  },
};

export default adminService;
