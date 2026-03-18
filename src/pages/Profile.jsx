import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import apiFetch from '../utils/apiFetch';
import { API_CONFIG } from '../config/api';
import { getUserHandle, getUserDisplayName } from '../utils/userHelpers';
import { normalizePostContent } from '../utils/contentHelpers';
import Dialog from '../components/Dialog';
import AppHeader from '../components/AppHeader';
import CommentSection from '../components/CommentSection';
import { useSiteSettings } from '../context/SiteSettingsContext';
import shareIcon from '../assets/share.png';
import '../styles/Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
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

  const countAllComments = (comments) => {
    if (!Array.isArray(comments) || comments.length === 0) return 0;
    return comments.reduce((total, comment) => {
      return total + 1 + (countAllComments(comment.replies) || 0);
    }, 0);
  };

  const loadLikeAndCommentInfo = async (postId) => {
    try {
      const token = authService.getToken();
      const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (likesRes.ok) {
        const likesData = await likesRes.json();
        setLikeCounts((prev) => ({ ...prev, [postId]: likesData.likeCount || 0 }));
        setLikedPosts((prev) => ({ ...prev, [postId]: Boolean(likesData.likedByUser) }));
      }

      const commentsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        const comments = Array.isArray(data.comments) ? data.comments : [];
        setCommentCounts((prev) => ({ ...prev, [postId]: countAllComments(comments) }));
      }
    } catch (engagementError) {
      console.error(`Error loading engagement for post ${postId}:`, engagementError);
    }
  };

  useEffect(() => {
    if (!userPosts.length) return;
    userPosts.forEach((post) => {
      loadLikeAndCommentInfo(post.id);
    });
  }, [userPosts]);

  const handleToggleLike = async (postId) => {
    setLikeLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const token = authService.getToken();
      let isCurrentlyLiked = likedPosts[postId];

      if (typeof isCurrentlyLiked === 'undefined') {
        const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (likesRes.ok) {
          const likesData = await likesRes.json();
          isCurrentlyLiked = Boolean(likesData.likedByUser);
          setLikedPosts((prev) => ({ ...prev, [postId]: isCurrentlyLiked }));
          setLikeCounts((prev) => ({ ...prev, [postId]: likesData.likeCount || 0 }));
        } else {
          isCurrentlyLiked = false;
        }
      }

      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/like`, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setLikeCounts((prev) => ({ ...prev, [postId]: data.likeCount || 0 }));
      } else {
        await loadLikeAndCommentInfo(postId);
      }
    } catch (likeError) {
      console.error('Error toggling like:', likeError);
    } finally {
      setLikeLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = (postId) => {
    setOpenCommentsPostId((prev) => (prev === postId ? null : postId));
    loadLikeAndCommentInfo(postId);
  };

  const handleShare = async (postId, content) => {
    const url = `${window.location.origin}/home#post-${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${appName} Post`,
          text: content?.slice(0, 120) || `Check this post on ${appName}`,
          url,
        });
        return;
      } catch {
        // Fall through to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      openAlert('Link copied to clipboard!', 'Share');
    } catch {
      openAlert('Unable to copy link', 'Share');
    }
  };

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
    // Navigate to home and open DM chat with this user
    navigate('/home', { state: { openDirectChat: userId } });
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
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      <AppHeader showPageNav={false} />

      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        {/* Breadcrumbs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '12px 20px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          color: '#64748b',
          display: 'inline-block'
        }}>
          <span 
            onClick={() => navigate('/home')}
            style={{ cursor: 'pointer', color: '#667eea', fontWeight: '500' }}
          >
            Home
          </span>
          <span style={{ margin: '0 8px' }}>›</span>
          <span style={{ color: '#1e293b', fontWeight: '600' }}>Profile</span>
        </div>

        {!loading && !error && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            gap: '32px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={displayName} style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #667eea'
                }} />
              ) : (
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px',
                  fontWeight: '300'
                }}>
                  {avatarLetter}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                color: '#1e293b'
              }}>
                {displayName}
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                margin: '0 0 20px 0',
                fontWeight: '400'
              }}>
                @{getUserHandle(user)}
              </p>

              <div style={{
                display: 'flex',
                gap: '32px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {userPosts.length}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '500',
                    marginTop: '4px'
                  }}>
                    Posts
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {followerCount}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '500',
                    marginTop: '4px'
                  }}>
                    Followers
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {followingCount}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                    fontWeight: '500',
                    marginTop: '4px'
                  }}>
                    Following
                  </div>
                </div>
              </div>

              {user.bio && (
                <p style={{
                  fontSize: '15px',
                  color: '#475569',
                  margin: '16px 0 20px 0',
                  lineHeight: '1.6'
                }}>
                  {user.bio}
                </p>
              )}

              {!isOwnProfile && (
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{
                      padding: '8px 24px',
                      background: isFollowing ? '#dc2626' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: followLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: followLoading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => !followLoading && (e.target.style.background = isFollowing ? '#b91c1c' : '#5568d3')}
                    onMouseOut={(e) => (e.target.style.background = isFollowing ? '#dc2626' : '#667eea')}
                  >
                    {followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
                  </button>
                  <button 
                    onClick={handleMessage}
                    style={{
                      padding: '8px 24px',
                      background: 'white',
                      color: '#667eea',
                      border: '2px solid #667eea',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#f8fafc';
                      e.target.style.borderColor = '#5568d3';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#667eea';
                    }}
                  >
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
        <div>
          {userPosts.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '60px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '18px', marginBottom: '8px', color: '#1e293b', fontWeight: '600' }}>No posts yet</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>This user hasn't shared any posts yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <div className="post-actions">
                      <button
                        className={`action-btn ${likedPosts[post.id] ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(post.id)}
                        title="Like"
                        disabled={Boolean(likeLoading[post.id])}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={likedPosts[post.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {(likeCounts[post.id] || 0) > 0 && <span>{likeCounts[post.id]}</span>}
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleToggleComments(post.id)}
                        title="Comment"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        {(commentCounts[post.id] || 0) > 0 && <span>{commentCounts[post.id]}</span>}
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleShare(post.id, post.content)}
                        title="Share"
                      >
                        {shareIcon ? (
                          <img src={shareIcon} alt="Share" style={{ width: '18px', height: '18px', mixBlendMode: 'multiply', opacity: 0.7 }} />
                        ) : (
                          <span>↗</span>
                        )}
                      </button>
                    </div>
                    {openCommentsPostId === post.id && (
                      <CommentSection
                        postId={post.id}
                        currentUserId={currentUserId}
                        showToast={(message) => openAlert(message, 'Comments')}
                        onCommentAdded={() => loadLikeAndCommentInfo(post.id)}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>      <Dialog
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
