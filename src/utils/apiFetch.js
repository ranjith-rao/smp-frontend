import { authService } from '../services/authService';

/**
 * Global fetch wrapper that handles authentication errors
 * Automatically logs out and redirects to login on 401 (Unauthorized)
 */
export const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);

    const token = authService.getToken();
    const isUnauthorized = response.status === 401;
    const isForbidden = response.status === 403;

    let isTokenAuthError = false;
    if (isForbidden) {
      try {
        const errorData = await response.clone().json();
        const message = String(errorData?.message || '').toLowerCase();
        isTokenAuthError = message.includes('invalid or expired token') || message.includes('token expired');
      } catch {
        isTokenAuthError = false;
      }
    }

    // Handle expired/invalid auth globally and send user to the right login screen.
    if (token && (isUnauthorized || isTokenAuthError)) {
      authService.logout({ redirect: true, currentPath: window.location.pathname });
      throw new Error('Session expired. Please login again.');
    }

    return response;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

export default apiFetch;
