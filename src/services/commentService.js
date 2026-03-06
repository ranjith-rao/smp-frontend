import { API_CONFIG } from '../config/api';
import { authService } from './authService';
import apiFetch from '../utils/apiFetch';

export const commentService = {
  // Create a comment on a post
  async createComment(postId, content) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create comment');
    }

    return response.json();
  },

  // Get comments for a post (includes nested replies)
  async getComments(postId) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  },

  // Edit a comment
  async editComment(commentId, content) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/comments/${commentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to edit comment');
    }

    return response.json();
  },

  // Delete a comment
  async deleteComment(commentId) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete comment');
    }

    return response.json();
  },

  // Create a reply to a comment
  async createReply(commentId, content) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/comments/${commentId}/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create reply');
    }

    return response.json();
  },

  // Report a comment
  async reportComment(commentId, reason) {
    const token = authService.getToken();
    const response = await apiFetch(
      `${API_CONFIG.ENDPOINTS.POSTS}/comments/${commentId}/report`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to report comment');
    }

    return response.json();
  },
};

export default commentService;
