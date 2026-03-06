import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

/**
 * ProtectedAdminRoute component that checks if user is authenticated and is admin
 * If not logged in, redirects to /admin/login (admin login page)
 * If logged in but not admin, redirects to user home
 */
const ProtectedAdminRoute = ({ children }) => {
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.isAdmin();
  
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  
  // Regular users should not access admin pages
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

export default ProtectedAdminRoute;
