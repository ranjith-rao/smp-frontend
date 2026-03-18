import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import CommentSection from './CommentSection';
import { getUserHandle, getUserDisplayName } from '../utils/userHelpers';

const PostCard = ({
  post,
  openMenuPostId,
  editingPostId,
  editContent,
  setEditContent = () => {},
  editMedia = { type: null, data: null, name: '' },
  onEditMediaUpload = () => () => {},
  onRemoveEditMedia = () => {},
  onMenuToggle,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onReport = () => {},
  onToggleLike = () => {},
  onToggleComments = () => {},
  onShare = () => {},
  onEditEmojiSelect = () => {},
  showEditEmojiPicker = false,
  setShowEditEmojiPicker = () => {},
  likeCount = 0,
  commentCount = 0,
  isLiked = false,
  currentUserId,
  formatDate,
  markdownToHtml = (html) => html,
  shareIcon = null,
  onCommentAdded = () => {},
  openCommentsPostId = null,
  showToast = () => {},
  showMenu = true,
  onHashtagClick = () => {}
}) => {
  const navigate = useNavigate();
  const isEditing = editingPostId === post.id;
  const isMenuOpen = openMenuPostId === post.id;
  
  const isPagePost = post.pageId && post.page;
  
  const name = getUserDisplayName(post.user);
  const handle = `@${getUserHandle(post.user)}`;
  const avatar = post.user?.profileImageUrl;
  
  const pageName = post.page?.name;
  const pageAvatar = post.page?.profileImageUrl;

  const handleContentClick = (event) => {
    const hashtagLink = event.target.closest('[data-hashtag]');
    if (!hashtagLink) return;
    event.preventDefault();
    const fromText = hashtagLink.textContent?.trim();
    const fromDataAttr = hashtagLink.getAttribute('data-hashtag');
    const tag = fromText?.startsWith('#') ? fromText : fromDataAttr;
    if (!tag) return;
    onHashtagClick(tag);
  };

  const handleImageLoadError = (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = `https://picsum.photos/seed/post-${post.id}/1200/800`;
  };

  return (
    <article id={`post-${post.id}`} className="post-card">
      <div className="post-header">
        <div className="post-user">
          {isPagePost ? (
            <>
              <div className="dual-avatar">
                <div className="post-avatar page-avatar">
                  {pageAvatar ? <img src={pageAvatar} alt={pageName} loading="lazy" decoding="async" /> : pageName?.[0]}
                </div>
                <div className="post-avatar user-avatar">
                  {avatar ? <img src={avatar} alt={name} loading="lazy" decoding="async" /> : name[0]}
                </div>
              </div>
              <div className="post-meta" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h4>
                  <span 
                    onClick={() => navigate(`/pages/${post.pageId}`)}
                    style={{ cursor: 'pointer', fontWeight: '600', color: '#0f1419' }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {pageName}
                  </span>
                  {' '}
                  <span style={{ fontWeight: 'normal', color: '#64748b' }}>via</span>
                  {' '}
                  <span 
                    onClick={() => navigate(`/profile/${post.userId}`)}
                    style={{ cursor: 'pointer', fontWeight: '600', color: '#0f1419' }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {name}
                  </span>
                </h4>
                <span>{handle} • {formatDate(post.createdAt)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="post-avatar">
                {avatar ? <img src={avatar} alt={name} loading="lazy" decoding="async" /> : name[0]}
              </div>
              <div className="post-meta">
                <h4>
                  <span 
                    onClick={() => navigate(`/profile/${post.userId}`)}
                    style={{ cursor: 'pointer', fontWeight: '600', color: '#0f1419' }}
                    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                  >
                    {name}
                  </span>
                </h4>
                <span>{handle} • {formatDate(post.createdAt)}</span>
              </div>
            </>
          )}
        </div>
        {showMenu && (
          <div className="post-menu-wrapper">
            <button
              className="post-menu-btn"
              onClick={() => onMenuToggle(openMenuPostId === post.id ? null : post.id)}
            >
              •••
            </button>
            {isMenuOpen && (
              <div className="post-menu-dropdown">
                {post.userId === currentUserId ? (
                  <>
                    <button className="menu-item" onClick={() => onEditStart(post)}>
                      ✏️ Edit
                    </button>
                    <button
                      className="menu-item danger"
                      onClick={() => onDelete(post.id)}
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <button
                    className="menu-item"
                    onClick={() => onReport(post.id)}
                  >
                    ⚠️ Report
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {post.feeling && (
        <div className="post-feeling">{post.feeling}</div>
      )}
      {isEditing ? (
        <div className="edit-compose-card" style={{ display: 'grid', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', position: 'relative' }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Update your post..."
            style={{
              width: '100%',
              minHeight: '110px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '14px',
              color: '#0f172a',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          {editMedia?.data && (
            <div className="post-media" style={{ position: 'relative' }}>
              {editMedia.type === 'image' ? (
                <a href={editMedia.data} target="_blank" rel="noreferrer">
                  <img src={editMedia.data} alt="Edit media preview" loading="lazy" decoding="async" />
                </a>
              ) : (
                <video src={editMedia.data} controls />
              )}
              <button
                type="button"
                onClick={onRemoveEditMedia}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  border: 'none',
                  borderRadius: '999px',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  background: 'rgba(15,23,42,0.75)',
                  color: '#fff',
                  fontWeight: 700
                }}
              >
                ×
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <label className="compose-tool" style={{ cursor: 'pointer' }}>
              📷 Image
              <input type="file" accept="image/*" onChange={onEditMediaUpload('image')} style={{ display: 'none' }} />
            </label>
            <label className="compose-tool" style={{ cursor: 'pointer' }}>
              🎬 Video
              <input type="file" accept="video/*" onChange={onEditMediaUpload('video')} style={{ display: 'none' }} />
            </label>
            <div className="emoji-popover-anchor">
              <button 
                className="compose-tool" 
                type="button" 
                data-edit-emoji-toggle
                onClick={() => setShowEditEmojiPicker((prev) => !prev)}
                style={{
                  padding: '6px 12px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                😊 Emoji
              </button>
              {showEditEmojiPicker && (
                <div className="emoji-picker-wrapper">
                  <EmojiPicker onEmojiClick={onEditEmojiSelect} />
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onEditCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onEditSave(post.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#6366f1',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        post.content && (
          <div
            style={{ margin: 0, color: '#1e293b', fontSize: '15px', lineHeight: '1.5' }}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
          />
        )
      )}
      {!isEditing && post.mediaUrl && post.mediaType === 'image' && (
        <div className="post-media">
          <a href={post.mediaUrl} target="_blank" rel="noreferrer">
            <img src={post.mediaUrl} alt="Post" loading="lazy" decoding="async" onError={handleImageLoadError} />
          </a>
        </div>
      )}
      {!isEditing && post.mediaUrl && post.mediaType === 'video' && (
        <div className="post-media">
          <video src={post.mediaUrl} controls />
        </div>
      )}
      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onToggleLike(post.id)}
          title="Like"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          className="action-btn"
          onClick={() => onToggleComments(post.id)}
          title="Comment"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
        <button
          className="action-btn"
          onClick={() => onShare(post)}
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
          showToast={showToast}
          onCommentAdded={onCommentAdded}
        />
      )}
    </article>
  );
};

export default PostCard;
