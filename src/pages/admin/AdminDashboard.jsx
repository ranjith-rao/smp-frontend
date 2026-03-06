import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import apiFetch from '../../utils/apiFetch';
import { API_CONFIG } from '../../config/api';

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
    <div>
      <h1 style={{ color: '#1e293b', marginTop: 0 }}>Welcome to Admin Dashboard</h1>
      <p style={{ color: '#64748b', fontSize: '16px' }}>Select an option from the sidebar to manage your platform.</p>
      
      {/* Dashboard Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Total Users</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6366f1', margin: 0 }}>
            {stats.loading ? '...' : stats.totalUsers}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Total Posts</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
            {stats.loading ? '...' : stats.totalPosts}
          </p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px' }}>Pending Reports</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
            {stats.loading ? '...' : stats.pendingReports}
          </p>
        </div>
      </div>

      {stats.error && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
          Error loading stats: {stats.error}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
