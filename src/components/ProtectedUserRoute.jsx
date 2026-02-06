import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedUserRoute component that checks if user is authenticated
 * If not logged in, redirects to /login
 */
const ProtectedUserRoute = ({ children }) => {
  const isLoggedIn = authService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedUserRoute;
