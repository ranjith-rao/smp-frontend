import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../utils/apiFetch';
import API_CONFIG from '../config/api';
import { authService } from '../services/authService';
import PostCard from '../components/PostCard';
import Dialog from '../components/Dialog';
import Toast from '../components/Toast';
import { normalizePostContent } from '../utils/contentHelpers';
import shareIcon from '../assets/share.png';
import '../styles/Home.css';

const MyPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [toast, setToast] = useState(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [editMedia, setEditMedia] = useState({ type: null, data: null, name: '' });

  useEffect(() => {
    fetchMyPosts();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuPostId !== null && !event.target.closest('.post-menu-wrapper')) {
        setOpenMenuPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuPostId]);

  const fetchMyPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/posts/my-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (posts.length === 0) return;

    setLikeCounts((prev) => {
      const next = { ...prev };
      posts.forEach((post) => {
        if (next[post.id] === undefined) next[post.id] = 0;
      });
      return next;
    });

    setCommentsByPost((prev) => {
      const next = { ...prev };
      posts.forEach((post) => {
        if (!next[post.id]) next[post.id] = [];
      });
      return next;
    });
  }, [posts]);

  const loadLikeAndCommentInfo = useCallback(async (postId) => {
    try {
      const token = authService.getToken();
      const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (likesRes.ok) {
        const likesData = await likesRes.json();
        setLikeCounts((prev) => ({ ...prev, [postId]: likesData.likeCount }));
        setLikedPosts((prev) => ({ ...prev, [postId]: likesData.likedByUser }));
      }

      const commentsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setCommentsByPost((prev) => ({ ...prev, [postId]: commentsData.comments || [] }));
      }
    } catch (fetchError) {
      console.error(`Error loading likes/comments for post ${postId}:`, fetchError);
    }
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    posts.forEach((post) => loadLikeAndCommentInfo(post.id));
  }, [posts, loadLikeAndCommentInfo]);

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    setEditContent(post.content || '');
    setEditMedia({
      type: post.mediaType || null,
      data: post.mediaUrl || null,
      name: '',
    });
    setOpenMenuPostId(null);
  };

  const handleEditMediaUpload = (type) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const maxSize = type === 'video' ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ type: 'error', message: `${type === 'video' ? 'Video' : 'Image'} must be under ${type === 'video' ? '8MB' : '5MB'}` });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditMedia({ type, data: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditMedia = () => {
    setEditMedia({ type: null, data: null, name: '' });
  };

  const handleSaveEdit = async (postId) => {
    const normalizedContent = (editContent || '').trim();
    if (!normalizedContent && !editMedia.data) {
      setToast({ type: 'error', message: 'Post content or media is required' });
      return;
    }

    const token = authService.getToken();
    try {
      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: normalizedContent || null,
          mediaType: editMedia.type,
          mediaUrl: editMedia.data,
        }),
      });
      
      if (!res.ok) throw new Error('Unable to update');
      
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? {
        ...p,
        content: updated.content,
        mediaType: updated.mediaType,
        mediaUrl: updated.mediaUrl,
      } : p)));
      setEditingPostId(null);
      setEditContent('');
      setEditMedia({ type: null, data: null, name: '' });
      setShowEditEmojiPicker(false);
      setToast({ type: 'success', message: 'Post updated successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to update post' });
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditMedia({ type: null, data: null, name: '' });
    setShowEditEmojiPicker(false);
  };

  const handleEditEmojiSelect = (emojiObject) => {
    setEditContent((prev) => `${prev}${emojiObject.emoji}`);
  };

  const handleToggleComments = (postId) => {
    setOpenCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  const handleToggleLike = async (postId) => {
    try {
      const isCurrentlyLiked = likedPosts[postId];
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const token = authService.getToken();

      const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/like`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLikedPosts((prev) => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setLikeCounts((prev) => ({ ...prev, [postId]: data.likeCount }));
      }
    } catch (likeError) {
      console.error('Error toggling like:', likeError);
      setToast({ type: 'error', message: 'Unable to update like' });
    }
  };

  const getPostLink = (postId) => `${window.location.origin}/home#post-${postId}`;

  const handleShare = async (post) => {
    const url = getPostLink(post.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NEXUS Post',
          text: post.content?.slice(0, 120) || 'Check this post on NEXUS',
          url,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setToast({ type: 'success', message: 'Post link copied!' });
    } catch {
      setToast({ type: 'error', message: 'Unable to share post' });
    }
  };

  const handleDeletePost = async (postId) => {
    setDialogState({
      open: true,
      title: 'Delete Post?',
      message: 'This action cannot be undone.',
      onConfirm: async () => {
        const token = authService.getToken();
        try {
          const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Unable to delete');
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          setOpenMenuPostId(null);
          setToast({ type: 'success', message: 'Post deleted successfully' });
          setDialogState({ open: false, title: '', message: '', onConfirm: null });
        } catch (error) {
          setToast({ type: 'error', message: error.message || 'Unable to delete post' });
          setDialogState({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const countAllComments = (comments) => {
    if (!comments || comments.length === 0) return 0;
    return comments.reduce((total, comment) => total + 1 + countAllComments(comment.replies), 0);
  };

  // Markdown to HTML converter
  const markdownToHtmlFunc = (text) => {
    const normalized = normalizePostContent(text);
    if (!normalized) return '';
    let html = normalized
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/`(.*?)`/g, '<code>$1</code>')           // `code`
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')          // ### heading3
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')           // ## heading2
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')            // # heading1
      .replace(/^- (.*?)$/gm, '<li>$1</li>')            // - list
      .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')       // wrap in ul
      .replace(/\n/g, '<br/>');
    return html;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading your posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>📝 My Posts</h1>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ← Back
          </button>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '18px', marginBottom: '8px', color: '#1e293b' }}>No posts yet</p>
            <p style={{ fontSize: '14px', color: '#64748b' }}>Start sharing your thoughts with the community!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post) => (
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
                onToggleLike={handleToggleLike}
                onToggleComments={handleToggleComments}
                onShare={handleShare}
                onEditEmojiSelect={handleEditEmojiSelect}
                showEditEmojiPicker={showEditEmojiPicker}
                setShowEditEmojiPicker={setShowEditEmojiPicker}
                likeCount={likeCounts[post.id] ?? 0}
                commentCount={countAllComments(commentsByPost[post.id]) || 0}
                isLiked={Boolean(likedPosts[post.id])}
                shareIcon={shareIcon}
                onCommentAdded={() => loadLikeAndCommentInfo(post.id)}
                openCommentsPostId={openCommentsPostId}
                showToast={(message, type = 'info') => setToast({ message, type })}
                formatDate={formatDate}
                markdownToHtml={markdownToHtmlFunc}
                currentUserId={authService.getUserId()}
                showMenu={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Dialog */}
      {dialogState.open && (
        <Dialog
          isOpen={dialogState.open}
          title={dialogState.title}
          message={dialogState.message}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={dialogState.onConfirm}
          onCancel={() => setDialogState({ open: false, title: '', message: '', onConfirm: null })}
        />
      )}
    </div>
  );
};

export default MyPosts;
