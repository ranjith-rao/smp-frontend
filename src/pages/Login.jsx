import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Login = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const brandLogo = settings?.logoUrl || logoImage;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authService.isLoggedIn()) {
    return <Navigate to={authService.isAdmin() ? '/admin/dashboard' : '/home'} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      if (data.token) {
        // Check user role and redirect accordingly
        const userRole = authService.getRole();
        
        if (userRole === 'ADMIN') {
          // Admin users should go to admin dashboard
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Regular users go to home
          navigate('/home', { replace: true });
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <h1 className="auth-logo">
            <img src={brandLogo} alt={appName} className="auth-logo-image" />
            <span>{appName}</span>
          </h1>
          <p>Connect with the future.</p>
        </div>
        
        {error && <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group" style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="form-footer">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span>Don't have an account? <Link to="/register">Join {appName}</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;