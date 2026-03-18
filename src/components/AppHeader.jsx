import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';
import '../styles/AppHeader.css';

const AppHeader = ({ showPageNav = true, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const { settings } = useSiteSettings();

  useEffect(() => {
    let isMounted = true;
    if (authService.isLoggedIn()) {
      authService.getProfile()
        .then((data) => {
          if (isMounted) setProfile(data);
        })
        .catch(() => {
          if (isMounted) setProfile(null);
        });
    }
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const displayName = profile?.firstName || profile?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';
  const appName = settings?.appName || 'NEXUS';
  const brandLogo = settings?.logoUrl || logoImage;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/home" className="app-logo">
          <img src={brandLogo} alt={appName} className="app-logo-image" />
          <span>{appName}</span>
        </Link>

        {children ? (
          <div className="app-center-content">{children}</div>
        ) : showPageNav && (
          <nav className="app-nav">
            <Link to="/pages/explore" className={`app-nav-link ${isActive('/pages/explore') ? 'active' : ''}`}>
              Explore
            </Link>
            <Link to="/pages/my-pages" className={`app-nav-link ${isActive('/pages/my-pages') ? 'active' : ''}`}>
              My Pages
            </Link>
            <Link to="/pages/create" className={`app-nav-link ${isActive('/pages/create') ? 'active' : ''}`}>
              Create Page
            </Link>
          </nav>
        )}

        <div className="app-header-actions">
          <button className="app-profile" onClick={() => profile?.id && navigate(`/profile/${profile.id}`)}>
            <div className="app-avatar">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={displayName} />
              ) : (
                avatarLetter
              )}
            </div>
            <div className="app-profile-text">
              <div className="app-profile-name">{displayName}</div>
              <div className="app-profile-sub">View profile</div>
            </div>
          </button>
          <button className="app-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
