import { API_CONFIG } from '../config/api';

// Helper function to decode JWT and extract role
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const authService = {
  async register(email, password, firstName = '', lastName = '', phone = '') {
    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, phone }),
    });
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    
    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      
      // Decode token to get role and store it
      const decoded = decodeToken(data.token);
      if (decoded && decoded.role) {
        localStorage.setItem('userRole', decoded.role);
      }
      
      // Emit login event for other parts of the app
      window.dispatchEvent(new CustomEvent('auth:login'));
    }
    return data;
  },

  async verifyEmail(token) {
    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/verify?token=${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    
    // Check if response is successful
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }
    
    return data;
  },

  async requestPasswordReset(email) {
    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Unable to request reset link');
    }
    return data;
  },

  async resetPassword(token, password) {
    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Unable to reset password');
    }
    return data;
  },

  async getProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Unable to fetch profile');
    }
    return data;
  },

  async updateProfile(payload) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No auth token found');
    }

    const res = await fetch(`${API_CONFIG.ENDPOINTS.AUTH}/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Unable to update profile');
    }
    return data;
  },

  logout(options = {}) {
    const { redirect = false, currentPath = '' } = options;
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    // Emit logout event for other parts of the app
    window.dispatchEvent(new CustomEvent('auth:logout'));

    if (redirect) {
      this.redirectToLogin(currentPath);
    }
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getRole() {
    return localStorage.getItem('userRole');
  },

  getLoginRoute(currentPath = '') {
    const role = localStorage.getItem('userRole');
    if (role === 'ADMIN' || String(currentPath).startsWith('/admin')) {
      return '/admin/login';
    }
    return '/login';
  },

  redirectToLogin(currentPath = '') {
    const target = this.getLoginRoute(currentPath || window.location.pathname);
    if (window.location.pathname !== target) {
      window.location.replace(target);
    }
  },

  getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded?.userId || null;
  },

  isLoggedIn() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check if token is expired
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    // exp is in seconds, Date.now() is in milliseconds
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      // Auto-cleanup expired token
      this.logout();
      return false;
    }
    
    return true;
  },

  isAdmin() {
    return localStorage.getItem('userRole') === 'ADMIN';
  },
};
