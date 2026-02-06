import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedRoute component that checks if user is authenticated
 * If not logged in, redirects to login page
 */
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = authService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
