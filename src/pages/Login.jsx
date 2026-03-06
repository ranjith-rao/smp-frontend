import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          navigate('/admin/dashboard');
        } else {
          // Regular users go to home
          navigate('/home');
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
          <h1 className="app-logo">NEXUS</h1>
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
          <div className="input-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="form-footer">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span>Don't have an account? <Link to="/register">Join Nexus</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;