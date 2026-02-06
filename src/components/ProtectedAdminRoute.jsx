import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedAdminRoute component that checks if user is authenticated
 * If not logged in, redirects to /admin/login (admin login page)
 */
const ProtectedAdminRoute = ({ children }) => {
  const isLoggedIn = authService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

export default ProtectedAdminRoute;
