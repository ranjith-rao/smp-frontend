import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Prevent double verification attempts
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('No verification token provided.');
        return;
      }

      try {
        await authService.verifyEmail(token);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'The link is invalid or has expired. Please try registering again.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-logo">NEXUS</h1>
        
        {status === 'loading' && (
          <div className="status-box">
            <div className="spinner"></div>
            <p>Verifying your email, please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="status-box">
            <div style={{ fontSize: '50px', color: '#42b72a' }}>✔</div>
            <h2>Account Verified!</h2>
            <p>Your email has been successfully validated. You can now log in to your account.</p>
            <Link to="/login" className="btn-primary" style={{ display: 'block', textDecoration: 'none', marginTop: '20px' }}>
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="status-box">
            <div style={{ fontSize: '50px', color: '#e74c3c' }}>✖</div>
            <h2>Verification Failed</h2>
            <p>{errorMessage}</p>
            <Link to="/register" className="btn-primary" style={{ display: 'block', textDecoration: 'none', marginTop: '20px' }}>
              Back to Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
