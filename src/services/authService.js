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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getRole() {
    return localStorage.getItem('userRole');
  },

  isLoggedIn() {
    return !!localStorage.getItem('token');
  },

  isAdmin() {
    return localStorage.getItem('userRole') === 'ADMIN';
  },
};
