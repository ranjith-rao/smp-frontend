import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import Toast from '../components/Toast';
import apiFetch from '../utils/apiFetch';
import { API_CONFIG } from '../config/api';

const PageCreatePost = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setToast({ type: 'error', message: 'Only image or video files are allowed.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setMediaType(isImage ? 'image' : 'video');
      setMediaUrl(result);
      setMediaPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !mediaUrl) {
      setToast({ type: 'error', message: 'Please add content or media.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiFetch(`${API_CONFIG.BASE_URL}/api/pages/${pageId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim() || null,
          mediaType: mediaType || null,
          mediaUrl: mediaUrl || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create page post');
      }

      setToast({ type: 'success', message: 'Post created successfully!' });
      setTimeout(() => {
        navigate(`/pages/${pageId}`);
      }, 1500);
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AppHeader />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <h1 style={{ color: '#1e293b', marginBottom: '8px' }}>Create Page Post</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Share an update with your page followers
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Add Media (optional)
            </label>
            <input type="file" accept="image/*,video/*" onChange={handleMediaChange} />
            {mediaPreview && (
              <div style={{ marginTop: '12px' }}>
                {mediaType === 'image' ? (
                  <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                ) : (
                  <video src={mediaPreview} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate(`/pages/${pageId}`)}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#94a3b8' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default PageCreatePost;
