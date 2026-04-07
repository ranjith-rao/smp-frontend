import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/authService';
import notificationService from '../services/notificationService';
import { usePresence } from './PresenceContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { socket } = usePresence();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const loadedRef = useRef(false);

  const resetState = useCallback(() => {
    setItems([]);
    setUnreadCount(0);
    setNextCursor(null);
    setHasMore(false);
    loadedRef.current = false;
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!authService.getToken()) return;

    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(Number(data.unreadCount || 0));
    } catch {
      // fail silently
    }
  }, []);

  const fetchNotifications = useCallback(async ({ append = false } = {}) => {
    if (!authService.getToken()) return;

    if (append) {
      if (!hasMore || !nextCursor) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await notificationService.getNotifications({
        limit: 20,
        cursor: append ? nextCursor : null,
      });

      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setItems((prev) => {
        if (!append) return list;
        const merged = [...prev, ...list];
        const seen = new Set();
        return merged.filter((item) => {
          if (!item?.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });

      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
      loadedRef.current = true;
    } catch {
      if (!append) {
        setItems([]);
        setNextCursor(null);
        setHasMore(false);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [hasMore, nextCursor]);

  const markAsRead = useCallback(async (notificationId) => {
    setItems((prev) => prev.map((item) => (
      item.id === notificationId ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item
    )));

    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const data = await notificationService.markAsRead(notificationId);
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      await fetchUnreadCount();
      setItems((prev) => prev.map((item) => (
        item.id === notificationId ? { ...item, isRead: false, readAt: null } : item
      )));
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    const nowIso = new Date().toISOString();
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || nowIso })));
    setUnreadCount(0);

    try {
      const data = await notificationService.markAllAsRead();
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch {
      await fetchUnreadCount();
      await fetchNotifications({ append: false });
    }
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      resetState();
      return;
    }

    if (!loadedRef.current) {
      fetchNotifications({ append: false });
    }
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount, resetState]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      if (!notification?.id) return;
      setItems((prev) => {
        const deduped = prev.filter((item) => item.id !== notification.id);
        return [notification, ...deduped];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCount = ({ unreadCount: count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread-count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread-count', handleUnreadCount);
    };
  }, [socket]);

  useEffect(() => {
    const handleLogout = () => resetState();
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [resetState]);

  const value = useMemo(() => ({
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  }), [items, unreadCount, loading, loadingMore, hasMore, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
