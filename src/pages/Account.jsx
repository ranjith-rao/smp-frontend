import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/Account.css';

const Account = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    authService
      .getProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to load profile');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!profile) return 'Your account';
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    if (name) return name;
    if (profile.email) return profile.email.split('@')[0];
    return 'Your account';
  }, [profile]);

  const userHandle = useMemo(() => {
    if (!profile || !profile.email) return '@user';
    const prefix = profile.email.split('@')[0];
    const normalized = prefix.replace(/[^a-zA-Z0-9_\.]/g, '').slice(0, 18) || 'user';
    return `@${normalized}`;
  }, [profile]);

  const avatarLetter = useMemo(() => {
    return displayName ? displayName[0].toUpperCase() : 'U';
  }, [displayName]);

  return (
    <div className="account-page">
      <div className="account-card">
        <div className="account-header">
          <div className="account-avatar">{avatarLetter}</div>
          <div>
            <div className="account-name">{displayName}</div>
            <div className="account-handle">{userHandle}</div>
          </div>
        </div>

        <div className="account-details">
          <div>
            <span>Email</span>
            <strong>{profile?.email || '—'}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{profile?.role || 'USER'}</strong>
          </div>
        </div>

        {error && <div className="account-error">{error}</div>}

        <div className="account-actions">
          <button className="account-btn" onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      </div>
    </div>
  );
};

export default Account;
