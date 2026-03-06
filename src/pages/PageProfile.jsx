import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_CONFIG } from '../config/api';
import apiFetch from '../utils/apiFetch';
import Dialog from '../components/Dialog';
import Toast from '../components/Toast';
import AppHeader from '../components/AppHeader';
import PostCard from '../components/PostCard';
import { normalizePostContent } from '../utils/contentHelpers';
import shareIcon from '../assets/share.png';

const PageProfile = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editMedia, setEditMedia] = useState({ type: null, data: null, name: '' });

  const currentUserId = authService.getUserId();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchPageDetails();
  }, [pageId]);

  const fetchPageDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      setPage(data);
      if (typeof data.isFollowing === 'boolean') {
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isFollowing ? 'unfollow' : 'follow'} page`);
      }

      const nextFollowing = !isFollowing;
      setIsFollowing(nextFollowing);
      setPage((prev) => {
        if (!prev) return prev;
        const currentCount = prev.followerCount || prev.followers?.length || 0;
        const updatedCount = nextFollowing ? currentCount + 1 : Math.max(currentCount - 1, 0);
        return {
          ...prev,
          followerCount: updatedCount
        };
      });
      setToast({
        type: 'success',
        message: isFollowing ? 'Unfollowed page' : 'Following page!'
      });
      
      // Refresh page data
      fetchPageDetails();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDeletePage = async () => {
    setShowDeleteDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      setToast({
        type: 'success',
        message: 'Page deleted successfully'
      });

      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    }
  };

  const handleReportPage = async () => {
    if (!reportReason) return;

    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setToast({
        type: 'success',
        message: 'Report submitted successfully. Thank you for helping keep our community safe.'
      });

      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message
      });
    } finally {
      setReportLoading(false);
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const markdownToHtml = (markdown) => normalizePostContent(markdown);

  const handleToggleLike = useCallback(async (postId) => {
    try {
      const isCurrentlyLiked = likedPosts[postId];
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const token = authService.getToken();
      
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/like`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setLikeCounts(prev => ({
          ...prev,
          [postId]: (prev[postId] || 0) + (isCurrentlyLiked ? -1 : 1)
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [likedPosts]);

  const handleToggleComments = useCallback((postId) => {
    setOpenCommentsPostId(openCommentsPostId === postId ? null : postId);
  }, [openCommentsPostId]);

  const handleShare = useCallback((post) => {
    const url = `${window.location.origin}/home#post-${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'NEXUS Post',
        text: post.content?.slice(0, 120) || 'Check this post on NEXUS',
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setToast({ type: 'success', message: 'Link copied to clipboard!' });
    }
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    try {
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPage(prev => ({
          ...prev,
          posts: prev.posts.filter(p => p.id !== postId)
        }));
        setToast({ type: 'success', message: 'Post deleted' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({ type: 'error', message: 'Failed to delete post' });
    }
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingPostId(null);
    setEditContent('');
    setEditMedia({ type: null, data: null, name: '' });
  }, []);

  const handleSaveEdit = useCallback(async (postId) => {
    try {
      const token = authService.getToken();
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: editContent || null,
          mediaType: editMedia.type,
          mediaUrl: editMedia.data,
        }),
      });

      if (res.ok) {
        const updatedPost = await res.json();
        setPage(prev => ({
          ...prev,
          posts: prev.posts.map(p => p.id === postId ? updatedPost : p)
        }));
        handleCancelEdit();
        setToast({ type: 'success', message: 'Post updated' });
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      setToast({ type: 'error', message: 'Failed to update post' });
    }
  }, [editContent, editMedia]);

  const handleEditMediaUpload = (type) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditMedia({ type, data: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditMedia = useCallback(() => {
    setEditMedia({ type: null, data: null, name: '' });
  }, []);

  const handleReportPost = useCallback(async (postId) => {
    try {
      const token = authService.getToken();
      const reason = prompt('Report reason:');
      if (!reason) return;

      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        setToast({ type: 'success', message: 'Post reported' });
      }
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  }, []);

  const isPageOwner = currentUserId && page && currentUserId === page.owner.id;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: '#64748b'
      }}>
        Loading page...
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        color: '#ef4444'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2>Page not found</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          {error || 'The page you are looking for does not exist'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <AppHeader />
      {/* Page Banner */}
      <div style={{
        height: '300px',
        background: page.bannerImageUrl 
          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${page.bannerImageUrl})`
          : 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
      }} />

      {/* Page Header Section */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px',
        position: 'relative',
        marginTop: '-80px',
        marginBottom: '40px'
      }}>
        <div style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start'
        }}>
          {/* Page Avatar */}
          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '4px solid white',
            background: page.profileImageUrl 
              ? `url(${page.profileImageUrl})`
              : '#e2e8f0',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '60px',
            color: '#94a3b8',
            flexShrink: 0
          }}>
            {!page.profileImageUrl && '🏢'}
          </div>

          {/* Page Info */}
          <div style={{
            flex: 1,
            paddingTop: '40px',
            background: 'white',
            padding: '20px 20px 20px 0'
          }}>
            <h1 style={{ color: '#1e293b', margin: '0 0 8px 0' }}>{page.name}</h1>
            <p style={{
              color: '#64748b',
              margin: '0 0 16px 0',
              display: 'flex',
              gap: '16px',
              fontSize: '14px'
            }}>
              <span>📁 {page.category}</span>
              <span>👥 {page.followerCount || 0} followers</span>
              <span>📝 {page.posts?.length || 0} posts</span>
            </p>

            {/* Owner Info */}
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              margin: '12px 0'
            }}>
              Created by <strong>{page.owner.firstName} {page.owner.lastName}</strong>
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px'
            }}>
              {!isPageOwner ? (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    padding: '10px 24px',
                    background: isFollowing ? '#f1f5f9' : '#0284c7',
                    color: isFollowing ? '#1e293b' : 'white',
                    border: isFollowing ? '1px solid #e2e8f0' : 'none',
                    borderRadius: '6px',
                    cursor: followLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    opacity: followLoading ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!followLoading) {
                      e.target.style.background = isFollowing ? '#e2e8f0' : '#0369a1';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!followLoading) {
                      e.target.style.background = isFollowing ? '#f1f5f9' : '#0284c7';
                    }
                  }}
                >
                  {followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate(`/pages/${pageId}/manage`)}
                    style={{
                      padding: '10px 24px',
                      background: '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#0369a1'}
                    onMouseOut={(e) => e.target.style.background = '#0284c7'}
                  >
                    Manage Page
                  </button>
                  <button
                    onClick={() => navigate(`/pages/${pageId}/post`)}
                    style={{
                      padding: '10px 24px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'background 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#059669'}
                    onMouseOut={(e) => e.target.style.background = '#10b981'}
                  >
                    Create Post
                  </button>
                </>
              )}
              {currentUserId && page.ownerId !== currentUserId && (
                <button
                  onClick={() => setShowReportDialog(true)}
                  style={{
                    padding: '10px 24px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#dc2626'}
                  onMouseOut={(e) => e.target.style.background = '#ef4444'}
                >
                  Report Page
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#1e293b', margin: '0 0 12px 0' }}>About</h3>
        <p style={{
          color: '#475569',
          lineHeight: '1.6',
          margin: 0
        }}>
          {page.description}
        </p>
      </div>

      {/* Page Posts */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px 40px'
      }}>
        <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>Posts</h2>
        
        {page.posts && page.posts.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {page.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                openMenuPostId={openMenuPostId}
                editingPostId={editingPostId}
                editContent={editContent}
                setEditContent={setEditContent}
                editMedia={editMedia}
                onEditMediaUpload={handleEditMediaUpload}
                onRemoveEditMedia={handleRemoveEditMedia}
                onMenuToggle={setOpenMenuPostId}
                onEditStart={handleEditPost}
                onEditCancel={handleCancelEdit}
                onEditSave={handleSaveEdit}
                onDelete={handleDeletePost}
                onReport={handleReportPost}
                onToggleLike={handleToggleLike}
                onToggleComments={handleToggleComments}
                onShare={handleShare}
                likeCount={likeCounts[post.id] ?? 0}
                commentCount={commentsByPost[post.id]?.length || 0}
                isLiked={Boolean(likedPosts[post.id])}
                currentUserId={currentUserId}
                formatDate={timeAgo}
                markdownToHtml={markdownToHtml}
                shareIcon={shareIcon}
                onCommentAdded={() => {}}
                openCommentsPostId={openCommentsPostId}
                showToast={(msg, type) => setToast({ type, message: msg })}
              />
            ))}
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p>No posts yet. {isPageOwner && 'Create your first post!'}</p>
          </div>
        )}
      </div>

      {showDeleteDialog && (
        <Dialog
          title="Delete Page?"
          message="This will permanently delete your page and all its posts. This action cannot be undone."
          onConfirm={handleDeletePage}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText="Delete"
          confirmStyle={{ background: '#ef4444', color: 'white' }}
        />
      )}

      {showReportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#1e293b' }}>Report Page</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
              Help us understand what's wrong with this page. Please provide details about the issue.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                Reason for Report *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select a reason</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="spam">Spam or Misleading</option>
                <option value="harassment">Harassment or Abuse</option>
                <option value="copyright">Copyright or Intellectual Property</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                Description
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional details (optional)"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReportPage}
                disabled={!reportReason || reportLoading}
                style={{
                  padding: '10px 20px',
                  background: reportReason && !reportLoading ? '#ef4444' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: reportReason && !reportLoading ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PageProfile;
