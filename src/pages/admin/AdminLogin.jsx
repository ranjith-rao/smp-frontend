import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
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
          <input 
            type="password" 
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            required
          />
          <button type="submit" className="btn-primary" style={{ backgroundColor: '#334155' }} disabled={loading}>
            {loading ? 'Signing In...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};



export default AdminLogin;