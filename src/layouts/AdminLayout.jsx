import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#0f172a', color: 'white', padding: '20px', overflowY: 'auto', boxShadow: '0 0 20px rgba(0,0,0,0.3)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '30px', fontSize: '20px', fontWeight: '700', color: '#e2e8f0' }}>Nexus Admin</h3>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link 
            to="/admin/dashboard"
            style={{
              color: isActive('/admin/dashboard') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/dashboard') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/dashboard') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/dashboard') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Dashboard
          </Link>
          
          <Link 
            to="/admin/users"
            style={{
              color: isActive('/admin/users') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/users') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/users') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/users') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Manage Users
          </Link>
          
          <Link 
            to="/admin/pages"
            style={{
              color: isActive('/admin/pages') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/pages') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/pages') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/pages') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Manage Pages
          </Link>
          
          <Link 
            to="/admin/posts"
            style={{
              color: isActive('/admin/posts') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/posts') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/posts') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/posts') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Manage Posts
          </Link>
          
          <Link 
            to="/admin/reports"
            style={{
              color: isActive('/admin/reports') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/reports') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/reports') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/reports') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Reports
          </Link>

          <Link 
            to="/admin/queries"
            style={{
              color: isActive('/admin/queries') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/queries') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/queries') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/queries') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Manage Queries
          </Link>

          <Link 
            to="/admin/content"
            style={{
              color: isActive('/admin/content') ? '#6366f1' : '#94a3b8',
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: isActive('/admin/content') ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              fontWeight: isActive('/admin/content') ? '600' : '500',
              transition: 'all 0.2s ease',
              display: 'block'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = isActive('/admin/content') ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
          >
            Manage Menu Contents
          </Link>
          
          <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
          
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.color = '#ef4444';
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#94a3b8';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', backgroundColor: '#f1f5f9', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;