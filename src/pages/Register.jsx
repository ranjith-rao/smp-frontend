import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Dialog from '../components/Dialog';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

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
          <h1 className="app-logo">NEXUS</h1>
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
          
          <input 
            name="password" 
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange} 
            required 
          />
          <input 
            name="confirmPassword" 
            type="password" 
            placeholder="Confirm Password" 
            value={formData.confirmPassword}
            onChange={handleChange} 
            required 
          />
          
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