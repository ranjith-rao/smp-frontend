import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Dialog from '../components/Dialog';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, password);
      setDialogState({
        open: true,
        title: 'Success',
        message: 'Password updated successfully! You can now login with your new password.',
        confirmText: 'Go to Login',
        variant: 'default'
      });
      dialogActionRef.current = () => {
        closeDialog();
        navigate('/login');
      };
    } catch (err) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-logo">NEXUS</h1>
        <h2>Create New Password</h2>
        <form onSubmit={handleReset} className="login-form">
          <input 
            type="password" 
            placeholder="New Password" 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          {error && <p style={{color: 'red'}}>{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
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

export default ResetPassword;