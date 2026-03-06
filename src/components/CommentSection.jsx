import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { commentService } from '../services/commentService';
import { authService } from '../services/authService';
import { getUserHandle, getUserDisplayName } from '../utils/userHelpers';
import Dialog from './Dialog';
import '../styles/CommentSection.css';

// Memoized CommentItem component to prevent re-renders and focus loss
const CommentItem = memo(({ 
  comment, 
  depth = 0, 
  currentUserId,
  editingCommentId,
  setEditingCommentId,
  editingContent,
  setEditingContent,
  replyingToId,
  setReplyingToId,
  replyContent,
  setReplyContent,
  reportingCommentId,
  setReportingCommentId,
  reportReason,
  setReportReason,
  handleEditComment,
  handleDeleteComment,
  handleAddReply,
  handleReportComment,
  handleReplyEmojiSelect,
  showReplyEmojiPickerForId,
  setShowReplyEmojiPickerForId,
  navigate,
}) => {
  const isOwn = comment.userId === currentUserId;
  const isEditing = editingCommentId === comment.id;

  const handleUserClick = () => {
    navigate(`/profile/${comment.userId}`);
  };

  return (
    <div className="comment-item" style={{ marginLeft: `${depth * 20}px` }}>
      <div className="comment-header">
        <div className="comment-user" onClick={handleUserClick} style={{ cursor: 'pointer' }}>
          <strong>
            {getUserDisplayName(comment.user)}
          </strong>
          <span className="comment-handle">
            @{getUserHandle(comment.user)}
          </span>
        </div>
        <span className="comment-time">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>

      {isEditing ? (
        <div className="comment-edit-form">
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            style={{ width: '100%', minHeight: '60px' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleEditComment(comment.id, editingContent)}
              style={{
                padding: '6px 12px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingCommentId(null);
                setEditingContent('');
              }}
              style={{
                padding: '6px 12px',
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="comment-content">{comment.content}</div>
          <div className="comment-actions">
            <button
              onClick={() => setReplyingToId(comment.id)}
              className="comment-action-btn"
              title="Reply"
              aria-label="Reply"
            >
              ↩
            </button>
            {isOwn && (
              <>
                <button
                  onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditingContent(comment.content);
                  }}
                  className="comment-action-btn"
                  title="Edit"
                  aria-label="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="comment-action-btn delete"
                  title="Delete"
                  aria-label="Delete"
                >
                  🗑️
                </button>
              </>
            )}
            {!isOwn && (
              <button
                onClick={() => setReportingCommentId(comment.id)}
                className="comment-action-btn report"
                title="Report"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Report Form */}
          {reportingCommentId === comment.id && (
            <div className="comment-report-form">
              <textarea
                placeholder="Reason for reporting..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ width: '100%', minHeight: '60px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleReportComment(comment.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Submit Report
                </button>
                <button
                  onClick={() => {
                    setReportingCommentId(null);
                    setReportReason('');
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reply Form */}
          {replyingToId === comment.id && (
            <div className="comment-reply-form">
              <textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                style={{ width: '100%', minHeight: '60px', marginBottom: '8px' }}
              />
              <div className="comment-form-actions">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    className="comment-action-btn"
                    title="Add emoji"
                    aria-label="Add emoji"
                    onClick={() => setShowReplyEmojiPickerForId((prev) => (prev === comment.id ? null : comment.id))}
                  >
                    😊
                  </button>
                  {showReplyEmojiPickerForId === comment.id && (
                    <div style={{ position: 'absolute', zIndex: 20, marginTop: '8px' }}>
                      <EmojiPicker onEmojiClick={handleReplyEmojiSelect} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddReply(comment.id)}
                  className="comment-action-btn comment-send-btn"
                  title="Post reply"
                  aria-label="Post reply"
                >
                  ➤
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyContent('');
                    setShowReplyEmojiPickerForId(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="comment-replies">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  reportingCommentId={reportingCommentId}
                  setReportingCommentId={setReportingCommentId}
                  reportReason={reportReason}
                  setReportReason={setReportReason}
                  handleEditComment={handleEditComment}
                  handleDeleteComment={handleDeleteComment}
                  handleAddReply={handleAddReply}
                  handleReportComment={handleReportComment}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

const CommentSection = ({ postId, currentUserId, onCommentAdded, showToast }) => {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
  const [showReplyEmojiPickerForId, setShowReplyEmojiPickerForId] = useState(null);
  const [reportingCommentId, setReportingCommentId] = useState(null);
  const [reportReason, setReportReason] = useState('');
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
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await commentService.getComments(postId);
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      const comment = await commentService.createComment(postId, newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setShowCommentEmojiPicker(false);
      setError('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.message);
    }
  }, [postId, newComment, onCommentAdded]);

  const handleEditComment = useCallback(async (commentId, content) => {
    if (!content.trim()) return;

    try {
      await commentService.editComment(commentId, content);
      // Update comment in state
      const updateCommentInList = (commentList) => {
        return commentList.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content };
          }
          if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: updateCommentInList(comment.replies) };
          }
          return comment;
        });
      };
      setComments(updateCommentInList(comments));
      setEditingCommentId(null);
      setEditingContent('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [comments]);

  const handleDeleteComment = useCallback(async (commentId) => {
    openConfirm('Delete this comment?', async () => {
      try {
        await commentService.deleteComment(commentId);
        // Remove comment from state
        const removeCommentFromList = (commentList) => {
          return commentList
            .filter(comment => comment.id !== commentId)
            .map(comment => {
              if (comment.replies && comment.replies.length > 0) {
                return { ...comment, replies: removeCommentFromList(comment.replies) };
              }
              return comment;
            });
        };
        setComments(removeCommentFromList(comments));
        setError('');
      } catch (err) {
        setError(err.message);
      }
    }, 'Delete comment', 'Delete');
  }, [comments]);

  const handleAddReply = useCallback(async (parentCommentId) => {
    if (!replyContent.trim()) return;

    try {
      const reply = await commentService.createReply(parentCommentId, replyContent);
      // Add reply to parent comment
      const addReplyToList = (commentList) => {
        return commentList.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: addReplyToList(comment.replies) };
          }
          return comment;
        });
      };
      setComments(addReplyToList(comments));
      setReplyingToId(null);
      setReplyContent('');
      setShowReplyEmojiPickerForId(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [comments, replyContent]);

  const handleCommentEmojiSelect = useCallback((emojiObject) => {
    setNewComment((prev) => `${prev}${emojiObject.emoji}`);
  }, []);

  const handleReplyEmojiSelect = useCallback((emojiObject) => {
    setReplyContent((prev) => `${prev}${emojiObject.emoji}`);
  }, []);

  const handleReportComment = useCallback(async (commentId) => {
    if (!reportReason.trim()) return;

    try {
      await commentService.reportComment(commentId, reportReason);
      setReportingCommentId(null);
      setReportReason('');
      setError('');
      if (showToast) {
        showToast('Comment reported successfully', 'success');
      }
    } catch (err) {
      setError(err.message);
      if (showToast) {
        showToast('Failed to report comment', 'error');
      }
    }
  }, [reportReason, showToast]);

  return (
    <div className="comment-section">
      {error && (
        <div style={{ color: '#dc2626', marginBottom: '12px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* New Comment Form */}
      <div className="comment-form">
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ width: '100%', minHeight: '80px', marginBottom: '8px' }}
        />
        <div className="comment-form-actions">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              className="comment-action-btn"
              title="Add emoji"
              aria-label="Add emoji"
              onClick={() => setShowCommentEmojiPicker((prev) => !prev)}
            >
              😊
            </button>
            {showCommentEmojiPicker && (
              <div style={{ position: 'absolute', zIndex: 20, marginTop: '8px' }}>
                <EmojiPicker onEmojiClick={handleCommentEmojiSelect} />
              </div>
            )}
          </div>
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || loading}
            className="comment-action-btn comment-send-btn"
            title="Post comment"
            aria-label="Post comment"
          >
            {loading ? '…' : '➤'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 && !loading && (
          <div style={{ color: '#94a3b8', padding: '20px', textAlign: 'center' }}>
            No comments yet. Be the first to comment!
          </div>
        )}
        {comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment}
            currentUserId={currentUserId}
            editingCommentId={editingCommentId}
            setEditingCommentId={setEditingCommentId}
            editingContent={editingContent}
            setEditingContent={setEditingContent}
            replyingToId={replyingToId}
            setReplyingToId={setReplyingToId}
            replyContent={replyContent}
            setReplyContent={setReplyContent}
            reportingCommentId={reportingCommentId}
            setReportingCommentId={setReportingCommentId}
            reportReason={reportReason}
            setReportReason={setReportReason}
            handleEditComment={handleEditComment}
            handleDeleteComment={handleDeleteComment}
            handleAddReply={handleAddReply}
            handleReportComment={handleReportComment}
            handleReplyEmojiSelect={handleReplyEmojiSelect}
            showReplyEmojiPickerForId={showReplyEmojiPickerForId}
            setShowReplyEmojiPickerForId={setShowReplyEmojiPickerForId}
            navigate={navigate}
          />
        ))}
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

export default CommentSection;
