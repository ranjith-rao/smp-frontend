import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import apiFetch from '../../utils/apiFetch';
import { API_CONFIG } from '../../config/api';
import '../../styles/AdminPages.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    pendingReports: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch total users
      const usersRes = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/all?page=1&limit=999999`, {
        headers
      });
      const usersData = await usersRes.json();
      const totalUsers = usersData.totalUsers || 0;

      // Fetch total posts
      const postsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/all?limit=999999`, {
        headers
      });
      const postsData = await postsRes.json();
      const totalPosts = postsData.posts?.length || 0;

      // Fetch reports
      const reportsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/reports`, {
        headers
      });
      const reportsData = await reportsRes.json();
      const pendingReports = reportsData.reports?.filter(r => r.status === 'PENDING').length || 0;

      setStats({
        totalUsers,
        totalPosts,
        pendingReports,
        loading: false,
        error: null
      });
    } catch (err) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  return (
    <div className="admin-page admin-dashboard-page">
      <div className="admin-page-header stacked">
        <h1 className="admin-page-title">Welcome to Admin Dashboard</h1>
        <p className="admin-page-subtitle">Select an option from the sidebar to manage your platform.</p>
      </div>
      
      {/* Dashboard Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <h3>Total Users</h3>
          <p className="admin-stat-value primary">
            {stats.loading ? '...' : stats.totalUsers}
          </p>
        </div>
        <div className="admin-stat-card">
          <h3>Total Posts</h3>
          <p className="admin-stat-value success">
            {stats.loading ? '...' : stats.totalPosts}
          </p>
        </div>
        <div className="admin-stat-card">
          <h3>Pending Reports</h3>
          <p className="admin-stat-value warning">
            {stats.loading ? '...' : stats.pendingReports}
          </p>
        </div>
      </div>

      {stats.error && (
        <div className="admin-banner error">
          Error loading stats: {stats.error}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
