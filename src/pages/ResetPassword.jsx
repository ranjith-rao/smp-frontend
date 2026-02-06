import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleReset = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    console.log("Updating password with token:", token);
    // Later: API call to update password in Postgres
    alert("Password updated successfully!");
    navigate('/login');
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
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;