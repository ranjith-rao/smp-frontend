import React from 'react';
import { usePresence } from '../context/PresenceContext';

const OnlineIndicator = ({ userId, showOffline = true, size = 'small' }) => {
  const { isUserOnline } = usePresence();
  const online = isUserOnline(userId);

  const sizeMap = {
    small: 8,
    medium: 10,
    large: 12
  };

  const dotSize = sizeMap[size] || 8;

  return (
    <div
      style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        backgroundColor: online ? '#10b981' : '#94a3b8',
        border: '2px solid white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        flexShrink: 0,
        zIndex: 10
      }}
      title={online ? 'Online' : 'Offline'}
    />
  );
};

export default OnlineIndicator;
