import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { API_CONFIG } from '../../config/api';
import apiFetch from '../../utils/apiFetch';
import Dialog from '../../components/Dialog';
import { getUserHandle } from '../../utils/userHelpers';
import '../../styles/AdminPostDetails.css';

const AdminPostDetails = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState('');
  const [likesSearch, setLikesSearch] = useState('');
  const [commentsSearch, setCommentsSearch] = useState('');
  const [likesLimit, setLikesLimit] = useState(50);
  const [commentsLimit, setCommentsLimit] = useState(50);
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

  const openConfirm = (message, onConfirm, title = 'Confirm', confirmText = 'Confirm') => {
    setDialogState({
      open: true,
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      variant: 'danger'
    });
    dialogActionRef.current = async () => {
      closeDialog();
      await onConfirm();
    };
  };

  const handleDialogConfirm = async () => {
    if (dialogActionRef.current) {
      await dialogActionRef.current();
    } else {
      closeDialog();
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(text || 'Failed to load post');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load post');
        const found = (data.posts || []).find((item) => String(item.id) === String(postId));
        if (!found) throw new Error('Post not found.');
        setPost(found);
      } catch (err) {
        setError(err.message || 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [postId]);

  useEffect(() => {
    const fetchEngagement = async () => {
      setDetailsLoading(true);
      try {
        const token = authService.getToken();
        const likesRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const likesData = await likesRes.json();
        setLikes(likesData.likes || []);

        const commentsRes = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const commentsData = await commentsRes.json();
        setComments(commentsData.comments || []);
      } catch (err) {
        setError(err.message || 'Failed to load engagement data');
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchEngagement();
  }, [postId]);

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const filteredLikes = useMemo(() => {
    const query = likesSearch.trim().toLowerCase();
    if (!query) return likes;
    return likes.filter((like) => {
      const name = `${like.user?.firstName || ''} ${like.user?.lastName || ''}`.toLowerCase();
      const username = getUserHandle(like.user).toLowerCase();
      const email = (like.user?.email || '').toLowerCase();
      return name.includes(query) || username.includes(query) || email.includes(query);
    });
  }, [likes, likesSearch]);

  const filteredComments = useMemo(() => {
    const query = commentsSearch.trim().toLowerCase();
    if (!query) return comments;
    return comments.filter((comment) => {
      const author = `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.toLowerCase();
      const username = getUserHandle(comment.user).toLowerCase();
      const email = (comment.user?.email || '').toLowerCase();
      const content = (comment.content || '').toLowerCase();
      return author.includes(query) || username.includes(query) || email.includes(query) || content.includes(query);
    });
  }, [comments, commentsSearch]);

  const handleDeletePost = async () => {
    openConfirm('Delete this post permanently?', async () => {
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/admin/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete post');
        navigate('/admin/posts');
      } catch (err) {
        setError(err.message || 'Failed to delete post');
      }
    }, 'Delete post', 'Delete');
  };

  const handleDeleteComment = async (commentId) => {
    openConfirm('Delete this comment?', async () => {
      try {
        const token = authService.getToken();
        const res = await apiFetch(`${API_CONFIG.ENDPOINTS.POSTS}/comments/${commentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete comment');
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(err.message || 'Failed to delete comment');
      }
    }, 'Delete comment', 'Delete');
  };

  return (
    <div className="admin-post-details">
      <div className="admin-post-header">
        <div>
          <button className="admin-back-btn" onClick={() => navigate('/admin/posts')}>
            ← Back to posts
          </button>
          <h1>Post details</h1>
          <nav className="breadcrumbs" style={{ fontSize: '14px', color: '#64748b' }}>
            <span onClick={() => navigate('/admin/posts')} style={{ cursor: 'pointer', color: '#6366f1', textDecoration: 'underline' }}>Manage Posts</span>
            <span> / </span>
            <span>Post Details</span>
          </nav>
        </div>
        <div className="admin-post-actions">
          <button className="admin-danger-btn" onClick={handleDeletePost}>Delete Post</button>
        </div>
      </div>

      {error && <div className="admin-post-error">{error}</div>}

      {loading ? (
        <div className="admin-post-loading">Loading post...</div>
      ) : post ? (
        <div className="admin-post-summary">
          <div className="admin-post-meta">
            <div>
              <div className="admin-post-author">
                <span>{post.author?.firstName} {post.author?.lastName}</span>
                <span className="admin-post-email">{post.author?.email}</span>
              </div>
              <div className="admin-post-date">Created: {formatDate(post.createdAt)}</div>
            </div>
            <div className="admin-post-metrics">
              <div>
                <span>Likes</span>
                <strong>{post.likeCount || likes.length}</strong>
              </div>
              <div>
                <span>Comments</span>
                <strong>{post.commentCount || comments.length}</strong>
              </div>
            </div>
          </div>
          <div className="admin-post-content">
            {post.content || '(No content)'}
          </div>
          {post.mediaUrl && (
            <div className="admin-post-media">
              {post.mediaType === 'image' ? (
                <img src={post.mediaUrl} alt="Post media" />
              ) : (
                <video src={post.mediaUrl} controls />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="admin-post-loading">Post not found.</div>
      )}

      <div className="admin-post-panels">
        <section>
          <div className="panel-header">
            <div>
              <h3>Likes</h3>
              <p>{filteredLikes.length} users</p>
            </div>
            <input
              type="text"
              placeholder="Search likes..."
              value={likesSearch}
              onChange={(e) => setLikesSearch(e.target.value)}
            />
          </div>
          {detailsLoading ? (
            <div className="panel-loading">Loading likes...</div>
          ) : filteredLikes.length === 0 ? (
            <div className="panel-empty">No likes found.</div>
          ) : (
            <div className="panel-list">
              {filteredLikes.slice(0, likesLimit).map((like) => (
                <div key={`${like.userId}-${like.user?.id}`} className="panel-item">
                  <div className="panel-item-main">
                    <strong>{like.user?.firstName} {like.user?.lastName}</strong>
                    <span>@{getUserHandle(like.user)}</span>
                  </div>
                </div>
              ))}
              {filteredLikes.length > likesLimit && (
                <button className="panel-load-more" onClick={() => setLikesLimit((prev) => prev + 50)}>
                  Load more
                </button>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="panel-header">
            <div>
              <h3>Comments</h3>
              <p>{filteredComments.length} comments</p>
            </div>
            <input
              type="text"
              placeholder="Search comments..."
              value={commentsSearch}
              onChange={(e) => setCommentsSearch(e.target.value)}
            />
          </div>
          {detailsLoading ? (
            <div className="panel-loading">Loading comments...</div>
          ) : filteredComments.length === 0 ? (
            <div className="panel-empty">No comments found.</div>
          ) : (
            <div className="panel-list">
              {filteredComments.slice(0, commentsLimit).map((comment) => (
                <div key={comment.id} className="panel-item comment-item">
                  <div className="panel-item-main">
                    <strong>{comment.user?.firstName} {comment.user?.lastName}</strong>
                    <span>@{getUserHandle(comment.user)}</span>
                    <p>{comment.content}</p>
                  </div>
                  <div className="panel-item-actions">
                    <button onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {filteredComments.length > commentsLimit && (
                <button className="panel-load-more" onClick={() => setCommentsLimit((prev) => prev + 50)}>
                  Load more
                </button>
              )}
            </div>
          )}
        </section>
      </div>

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

export default AdminPostDetails;
