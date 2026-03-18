import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';
import '../styles/AdminPortal.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const brandLogo = settings?.logoUrl || logoImage;

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/pages', label: 'Manage Pages' },
    { to: '/admin/posts', label: 'Manage Posts' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/queries', label: 'Manage Queries' },
    { to: '/admin/content', label: 'Manage Menu Contents' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h3 className="admin-brand">
          <img src={brandLogo} alt={appName} className="admin-brand-logo" />
          <span>{appName} Admin</span>
        </h3>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link ${isActive(item.to) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          <hr className="admin-nav-divider" />

          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
      </div>
  );
};

export default AdminLayout;