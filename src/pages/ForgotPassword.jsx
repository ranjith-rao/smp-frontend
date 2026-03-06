import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to request reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <h1 className="app-logo">NEXUS</h1>
          <h2>Reset Password</h2>
          {!submitted ? (
            <p>Enter your email and we'll send you a link to get back into your account.</p>
          ) : null}
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="login-form">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            {error && <p style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="form-footer">
              <Link to="/login">Back to Login</Link>
            </div>
          </form>
        ) : (
          <div className="status-box">
            <div style={{ fontSize: '50px', color: '#6366f1' }}>📩</div>
            <p>If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.</p>
            <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', marginTop: '20px' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;