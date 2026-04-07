import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useNotifications } from '../context/NotificationContext';
import '../styles/AppHeader.css';

const AppHeader = ({ showPageNav = true, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationPanelRef = useRef(null);
  const { settings } = useSiteSettings();
  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    loadingMore,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

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

  const formatNotificationTime = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const resolveNotificationLink = (notification) => {
    if (!notification) return '/home';
    if (notification.entityType === 'user' && notification.entityId) {
      return `/profile/${notification.entityId}`;
    }
    if (notification.entityType === 'post') {
      if (notification.userId && notification.entityId) {
        return `/profile/${notification.userId}#post-${notification.entityId}`;
      }
      return '/home';
    }
    return '/home';
  };

  const topNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification) return;

    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    setIsNotificationOpen(false);
    navigate(resolveNotificationLink(notification));
  };

  useEffect(() => {
    if (!isNotificationOpen) return;

    const handleOutsideClick = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotificationOpen]);

  useEffect(() => {
    if (isNotificationOpen) {
      fetchNotifications({ append: false });
    }
  }, [isNotificationOpen, fetchNotifications]);

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
          <div className="app-notification-wrap" ref={notificationPanelRef}>
            <button
              className="app-notification-button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="app-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>

            {isNotificationOpen && (
              <div className="app-notification-panel">
                <div className="app-notification-panel-header">
                  <strong>Notifications</strong>
                  <button
                    className="app-notification-read-all"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </button>
                </div>

                {notificationsLoading ? (
                  <div className="app-notification-empty">Loading notifications...</div>
                ) : topNotifications.length === 0 ? (
                  <div className="app-notification-empty">No notifications yet.</div>
                ) : (
                  <div className="app-notification-list">
                    {topNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={`app-notification-item ${notification.isRead ? '' : 'unread'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="app-notification-title-row">
                          <span className="app-notification-title">{notification.title}</span>
                          {!notification.isRead && <span className="app-notification-dot" />}
                        </div>
                        {notification.body && <div className="app-notification-body">{notification.body}</div>}
                        <div className="app-notification-time">{formatNotificationTime(notification.createdAt)}</div>
                      </button>
                    ))}
                  </div>
                )}

                {hasMore && (
                  <button
                    className="app-notification-load-more"
                    onClick={() => fetchNotifications({ append: true })}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

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
