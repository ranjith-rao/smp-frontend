import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Dialog from '../components/Dialog';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Register = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const brandLogo = settings?.logoUrl || logoImage;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dialogActionRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    variant: 'default'
  });

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogActionRef.current = null;
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    // 2. Phone Number Validation (Regex)
    const phoneRegex = /^[0-9]{10}$/; 
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const data = await authService.register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone
      );
      
      if (data.message && data.message.includes('successfully')) {
        setDialogState({
          open: true,
          title: 'Registration Successful',
          message: 'Your account has been created! We have sent a verification link to your email. Please verify before logging in.',
          confirmText: 'Go to Login',
          variant: 'default'
        });
        dialogActionRef.current = () => {
          closeDialog();
          navigate('/login');
        };
      } else {
        setError(data.message || 'Registration failed');
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
          <p>Join the community.</p>
        </div>
        
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <form onSubmit={handleRegister} className="login-form">
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              name="firstName" 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={handleChange} 
              required 
            />
            <input 
              name="lastName" 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={handleChange} 
              required 
            />
          </div>
          
          <input 
            name="phone" 
            type="tel" 
            placeholder="Phone Number" 
            value={formData.phone}
            onChange={handleChange} 
            required 
          />
          <input 
            name="email" 
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange} 
            required 
          />

          <div style={{ position: 'relative' }}>
            <input 
              name="password" 
              type={showPassword ? 'text' : 'password'}
              placeholder="Password" 
              value={formData.password}
              onChange={handleChange} 
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

          <div style={{ position: 'relative' }}>
            <input 
              name="confirmPassword" 
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={handleChange} 
              required 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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
              {showConfirmPassword ? (
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="form-footer">
            <span>Already have an account? <Link to="/login">Sign In</Link></span>
          </div>
        </form>
      </div>

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        variant={dialogState.variant}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
};

export default Register;