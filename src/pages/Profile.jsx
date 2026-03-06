import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import apiFetch from '../utils/apiFetch';
import { API_CONFIG } from '../config/api';
import { getUserHandle, getUserDisplayName } from '../utils/userHelpers';
import { normalizePostContent } from '../utils/contentHelpers';
import Dialog from '../components/Dialog';
import '../styles/Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const dialogActionRef = useRef(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    variant: 'default'
  });

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogActionRef.current = null;
  };

  const openAlert = (message, title = 'Notice') => {
    setDialogState({
      open: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      variant: 'default'
    });
    dialogActionRef.current = () => closeDialog();
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  const currentUserId = useMemo(() => authService.getUserId(), []);
  const isOwnProfile = currentUserId === parseInt(userId);

  const displayName = useMemo(() => getUserDisplayName(user), [user]);

  const avatarLetter = useMemo(() => displayName ? displayName[0].toUpperCase() : 'U', [displayName]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`, {
          headers: { Authorization: `Bearer ${authService.getToken()}` },
        });

        if (!res.ok) {
          throw new Error('User not found');
        }

        const userData = await res.json();
        setUser(userData);
        setFollowerCount(userData.followerCount || 0);
        setFollowingCount(userData.followingCount || 0);

        // Check if current user is following this user (if not own profile)
        if (!isOwnProfile && userData.followers) {
          setIsFollowing(userData.followers.some(f => f.id === currentUserId));
        }
      } catch (err) {
        setError(err.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, currentUserId, isOwnProfile]);

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/user/${userId}`, {
          headers: { Authorization: `Bearer ${authService.getToken()}` },
        });

        if (!res.ok) {
          throw new Error('Unable to load posts');
        }

        const data = await res.json();
        setUserPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const token = authService.getToken();
      const method = isFollowing ? 'DELETE' : 'POST';
      const endpoint = `${API_CONFIG.ENDPOINTS.USERS}/${userId}/follow`;

      const res = await apiFetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'Failed to toggle follow');
      }

      // Update the follower count
      if (isFollowing) {
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        setFollowerCount(prev => prev + 1);
      }
      
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
      openAlert(`Error: ${err.message}`);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging feature
    console.log('Message functionality coming soon');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/home')}>Back to Home</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="error">User not found</div>
        <button onClick={() => navigate('/home')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-page-header">
        <div className="header-left">
          <div className="brand-logo">NEXUS</div>
        </div>
        <div className="header-right">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>

      {!loading && !error && (
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user.profileImageUrl ? (
              <img src={user.profileImageUrl} alt={displayName} />
            ) : (
              <div className="avatar-placeholder">{avatarLetter}</div>
            )}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-username">@{getUserHandle(user)}</p>

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-count">{userPosts.length}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat">
                <span className="stat-count">{followerCount}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="stat">
                <span className="stat-count">{followingCount}</span>
                <span className="stat-label">following</span>
              </div>
            </div>

            {user.bio && <p className="profile-bio">{user.bio}</p>}

            {!isOwnProfile && (
              <div className="profile-actions">
                <button 
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {followLoading ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
                </button>
                <button className="message-btn" onClick={handleMessage}>
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => navigate('/home')}>Back to Home</button>
        </div>
      )}

      {loading && <div className="loading">Loading profile...</div>}

      {!loading && !error && (
        <div className="profile-posts">
          <h2>Posts</h2>
          {userPosts.length === 0 ? (
            <p className="no-posts">No posts yet</p>
          ) : (
            <div className="posts-list">
              {userPosts.map((post) => {
                const name = getUserDisplayName(post.user);
                const handle = `@${getUserHandle(post.user)}`;
                const avatar = post.user?.profileImageUrl;
                const createdAt = new Date(post.createdAt);
                const timeAgo = Math.floor((Date.now() - createdAt) / 1000);
                const timeStr = timeAgo < 60 ? `${timeAgo}s` : 
                               timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m` :
                               timeAgo < 86400 ? `${Math.floor(timeAgo / 3600)}h` :
                               `${Math.floor(timeAgo / 86400)}d`;

                return (
                  <article key={post.id} className="post-card profile-post">
                    <div className="post-header">
                      <div className="post-user">
                        <div className="post-avatar">
                          {avatar ? <img src={avatar} alt={name} /> : name[0]}
                        </div>
                        <div className="post-meta">
                          <h4>{name}</h4>
                          <span>{handle} • {timeStr}</span>
                        </div>
                      </div>
                    </div>
                    {post.feeling && (
                      <div className="post-feeling">{post.feeling}</div>
                    )}
                    {post.content && (
                      <div className="post-content" style={{ margin: 0, color: '#1e293b', fontSize: '15px', lineHeight: '1.5' }}>
                        {normalizePostContent(post.content)}
                      </div>
                    )}
                    {post.mediaUrl && post.mediaType === 'image' && (
                      <div className="post-media">
                        <img src={post.mediaUrl} alt="Post" />
                      </div>
                    )}
                    {post.mediaUrl && post.mediaType === 'video' && (
                      <div className="post-media">
                        <video src={post.mediaUrl} controls />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog
        isOpen={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={handleDialogConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
};

export default Profile;
