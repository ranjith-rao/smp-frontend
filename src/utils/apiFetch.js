import { authService } from '../services/authService';

/**
 * Global fetch wrapper that handles authentication errors
 * Automatically logs out and redirects to login on 401 (Unauthorized)
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Logout user and redirect to login
      authService.logout();
      window.location.href = '/login';
      // Return early to prevent further processing
      return { ok: false, status: 401, message: 'Session expired. Please login again.' };
    }

    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

export default apiFetch;
