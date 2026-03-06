import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { authService } from '../services/authService';

const PresenceContext = createContext(null);

export const usePresence = () => {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }
  return context;
};

export const PresenceProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const token = authService.getToken();
    if (!token || socketRef.current) return;

    const socket = io('http://localhost:5000', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      setIsConnected(true);
      
      // Authenticate with JWT
      socket.emit('authenticate', token);
    });

    socket.on('auth:success', ({ userId }) => {
      // Successfully authenticated
    });

    socket.on('presence:initial', ({ onlineUsers }) => {
      setOnlineUsers(new Set(onlineUsers));
    });

    socket.on('auth:error', ({ message, code }) => {
      console.error('Socket auth error:', message);

      if (code === 'TOKEN_EXPIRED') {
        authService.logout();
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      socket.disconnect();
      setIsConnected(false);
      setOnlineUsers(new Set());
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('presence:update', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    socket.connect();
    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers(new Set());
    }
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Listen for storage changes (logout/login in same tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = authService.getToken();
      if (token && !socketRef.current?.connected) {
        connect();
      } else if (!token && socketRef.current?.connected) {
        disconnect();
      }
    };

    const handleLogout = () => {
      disconnect();
    };

    const handleLogin = () => {
      connect();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:login', handleLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, [connect, disconnect]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(parseInt(userId));
  }, [onlineUsers]);

  const value = {
    isConnected,
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    connect,
    disconnect,
    socket: socketRef.current
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};
