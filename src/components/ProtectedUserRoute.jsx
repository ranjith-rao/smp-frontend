import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedUserRoute component that checks if user is authenticated
 * If not logged in, redirects to /login
 * If admin, redirects to admin portal
 */
const ProtectedUserRoute = ({ children }) => {
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.isAdmin();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Admins should use admin portal, not user pages
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

export default ProtectedUserRoute;
