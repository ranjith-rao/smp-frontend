import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If user is already logged in as admin, redirect to admin dashboard
  if (authService.isLoggedIn() && authService.isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If user is logged in but not admin, clear the session so admin login can proceed
  useEffect(() => {
    if (authService.isLoggedIn() && !authService.isAdmin()) {
      authService.logout();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(credentials.email, credentials.password);
      
      if (data.token) {
        // Check if the logged-in user is an admin
        const userRole = authService.getRole();
        
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          // Non-admin users cannot use admin login
          authService.logout();
          setError('Only admin users can access this portal');
        }
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-card">
        <h2>Nexus Admin Portal</h2>
        
        {error && <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="email" 
            placeholder="Admin Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            required
          />
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#64748b'
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.92-2.17 2.36-4.02 4.12-5.35" />
                  <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-1 2.37-2.64 4.39-4.66 5.74" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button type="submit" className="btn-primary" style={{ backgroundColor: '#334155' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};



export default AdminLogin;